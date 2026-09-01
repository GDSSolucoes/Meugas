import { Injectable } from "@nestjs/common";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { RequestContextService } from "./request-context.service";
import {
  productPickups,
  productStockMovements,
  productStocks,
  purchaseItems,
  purchases,
  saleItems,
  sales,
  sectors,
  stockTransfers,
  StockMovementTypeEnum,
  vasilhameLoans,
} from "./schemas";
import { parseDateOnly } from "./schemas/date-only";

type RebuildRequest = {
  productIds: string[];
  sectorIds: string[];
  fromDate: Date;
};

type StockEvent = {
  productId: string;
  productName: string | null;
  actorSectorId: string;
  actorSectorName: string | null;
  ownerSectorId: string;
  type: StockMovementTypeEnum;
  sourceId: string;
  quantity: number;
  movementDate: Date;
  createdAt: Date | null;
  sequence: number;
};

@Injectable()
export class StockMovementRebuildService {
  constructor(private readonly requestContext: RequestContextService) {}

  async rebuild(request: RebuildRequest): Promise<void> {
    const db = this.requestContext.getDb();
    const companyId = this.requestContext.getCompanyId();
    if (!db || !companyId)
      throw new Error("DB or company context not available");

    const sectorsResult = await db
      .select()
      .from(sectors)
      .where(eq(sectors.companyId, companyId));
    const sectorById = new Map(
      sectorsResult.map((sector) => [sector.id, sector]),
    );
    const keys = new Map<
      string,
      { productId: string; ownerSectorId: string }
    >();

    for (const productId of request.productIds.filter(Boolean)) {
      for (const sectorId of request.sectorIds.filter(Boolean)) {
        const ownerSectorId = this.resolveOwnerSector(sectorId, sectorById);
        if (ownerSectorId)
          keys.set(`${productId}:${ownerSectorId}`, {
            productId,
            ownerSectorId,
          });
      }
    }

    for (const key of keys.values()) {
      await this.rebuildPartition(
        db,
        companyId,
        key,
        request.fromDate,
        sectorById,
      );
    }
  }

  private resolveOwnerSector(
    sectorId: string,
    sectorById: Map<string, any>,
  ): string {
    const sector = sectorById.get(sectorId);
    return sector?.isOwnStock ? sectorId : (sector?.masterSectorId ?? sectorId);
  }

  private async rebuildPartition(
    db: any,
    companyId: string,
    key: { productId: string; ownerSectorId: string },
    fromDate: Date,
    sectorById: Map<string, any>,
  ): Promise<void> {
    const opening = await db
      .select({ balance: productStockMovements.newBalance })
      .from(productStockMovements)
      .where(
        and(
          eq(productStockMovements.companyId, companyId),
          eq(productStockMovements.productId, key.productId),
          eq(productStockMovements.ownerSectorId, key.ownerSectorId),
          lt(productStockMovements.movementDate, fromDate),
        ),
      )
      .orderBy(
        desc(productStockMovements.movementDate),
        desc(productStockMovements.createdAt),
      )
      .limit(1);

    await db
      .delete(productStockMovements)
      .where(
        and(
          eq(productStockMovements.companyId, companyId),
          eq(productStockMovements.productId, key.productId),
          eq(productStockMovements.ownerSectorId, key.ownerSectorId),
          gte(productStockMovements.movementDate, fromDate),
        ),
      );

    const events = await this.loadEvents(
      db,
      companyId,
      key,
      fromDate,
      sectorById,
    );
    events.sort((left, right) => {
      return (
        (left.createdAt?.getTime() ?? 0) - (right.createdAt?.getTime() ?? 0)
      );
    });

    let balance = Number(opening[0]?.balance ?? 0);
    for (const event of events) {
      const previousBalance = balance;
      balance += event.quantity;
      const ownerSector = sectorById.get(event.ownerSectorId);
      await db.insert(productStockMovements).values({
        productId: event.productId,
        productName: event.productName,
        sectorId: event.actorSectorId,
        sectorName: event.actorSectorName,
        ownerSectorId: event.ownerSectorId,
        actorSectorId: event.actorSectorId,
        type: event.type,
        saleId:
          event.type === StockMovementTypeEnum.Sale ? event.sourceId : null,
        purchaseId:
          event.type === StockMovementTypeEnum.Purchase ? event.sourceId : null,
        stockTransferId:
          event.type === StockMovementTypeEnum.Transfer ? event.sourceId : null,
        productPickupId:
          event.type === StockMovementTypeEnum.Pickup ? event.sourceId : null,
        vasilhameLoanId:
          event.type === StockMovementTypeEnum.Loan ? event.sourceId : null,
        quantity: event.quantity,
        previousBalance,
        newBalance: balance,
        movementDate: event.movementDate,
        companyId,
        companyName: ownerSector?.companyName,
      });
    }

    const stock = await db
      .select({ id: productStocks.id })
      .from(productStocks)
      .where(
        and(
          eq(productStocks.companyId, companyId),
          eq(productStocks.productId, key.productId),
          eq(productStocks.sectorId, key.ownerSectorId),
        ),
      )
      .limit(1);
    if (stock.length > 0) {
      await db
        .update(productStocks)
        .set({ quantity: balance })
        .where(eq(productStocks.id, stock[0].id));
    } else {
      const productName =
        events.find((event) => event.productName)?.productName ?? null;
      const ownerSector = sectorById.get(key.ownerSectorId);
      if (ownerSector?.isOwnStock) {
        await db.insert(productStocks).values({
          productId: key.productId,
          productName,
          sectorId: key.ownerSectorId,
          sectorName: ownerSector.name,
          quantity: balance,
          initialDate: new Date(),
          companyId,
          companyName: ownerSector.companyName,
        });
      }
    }
  }

  private async loadEvents(
    db: any,
    companyId: string,
    key: { productId: string; ownerSectorId: string },
    fromDate: Date,
    sectorById: Map<string, any>,
  ): Promise<StockEvent[]> {
    const events: StockEvent[] = [];
    const add = (event: Omit<StockEvent, "ownerSectorId">) => {
      if (
        this.resolveOwnerSector(event.actorSectorId, sectorById) ===
        key.ownerSectorId
      ) {
        events.push({ ...event, ownerSectorId: key.ownerSectorId });
      }
    };

    const purchaseRows = await db
      .select({ item: purchaseItems, source: purchases })
      .from(purchaseItems)
      .innerJoin(purchases, eq(purchases.id, purchaseItems.purchaseId))
      .where(
        and(
          eq(purchaseItems.companyId, companyId),
          eq(purchaseItems.productId, key.productId),
          gte(purchases.purchaseDate, fromDate),
        ),
      );
    for (const row of purchaseRows) {
      if (!row.source.sectorId || !row.source.createdAt) continue;
      add({
        productId: key.productId,
        productName: row.item.productName,
        actorSectorId: row.source.sectorId,
        actorSectorName: row.source.sectorName,
        type: StockMovementTypeEnum.Purchase,
        sourceId: row.source.id,
        quantity: Number(row.item.quantity ?? 0),
        movementDate: new Date(row.source.createdAt),
        createdAt: row.source.createdAt,
        sequence: 0,
      });
    }

    const saleRows = await db
      .select({ item: saleItems, source: sales })
      .from(saleItems)
      .innerJoin(sales, eq(sales.id, saleItems.saleId))
      .where(
        and(
          eq(saleItems.companyId, companyId),
          eq(saleItems.productId, key.productId),
          gte(sales.saleDate, fromDate),
        ),
      );
    for (const row of saleRows) {
      if (!row.source.sectorId || !row.source.createdAt) continue;
      add({
        productId: key.productId,
        productName: row.item.productName,
        actorSectorId: row.source.sectorId,
        actorSectorName: row.source.sectorName,
        type: StockMovementTypeEnum.Sale,
        sourceId: row.source.id,
        quantity: -Number(row.item.quantity ?? 0),
        movementDate: new Date(row.source.createdAt),
        createdAt: row.source.createdAt,
        sequence: 0,
      });
    }

    const transfers = await db
      .select()
      .from(stockTransfers)
      .where(
        and(
          eq(stockTransfers.companyId, companyId),
          eq(stockTransfers.productId, key.productId),
          gte(stockTransfers.transferDate, fromDate),
        ),
      );
    for (const transfer of transfers) {
      if (
        transfer.fromSectorId &&
        transfer.transferDate &&
        this.resolveOwnerSector(transfer.fromSectorId, sectorById) ===
          key.ownerSectorId
      )
        add({
          productId: key.productId,
          productName: transfer.productName,
          actorSectorId: transfer.fromSectorId,
          actorSectorName: transfer.fromSectorName,
          type: StockMovementTypeEnum.Transfer,
          sourceId: transfer.id,
          quantity: -Number(transfer.quantity),
          movementDate: parseDateOnly(transfer.transferDate),
          createdAt: transfer.createdAt,
          sequence: 0,
        });
      if (
        transfer.toSectorId &&
        transfer.transferDate &&
        this.resolveOwnerSector(transfer.toSectorId, sectorById) ===
          key.ownerSectorId
      )
        add({
          productId: key.productId,
          productName: transfer.productName,
          actorSectorId: transfer.toSectorId,
          actorSectorName: transfer.toSectorName,
          type: StockMovementTypeEnum.Transfer,
          sourceId: transfer.id,
          quantity: Number(transfer.quantity),
          movementDate: parseDateOnly(transfer.transferDate),
          createdAt: transfer.createdAt,
          sequence: 1,
        });
    }

    const pickups = await db
      .select()
      .from(productPickups)
      .where(
        and(
          eq(productPickups.companyId, companyId),
          eq(productPickups.productId, key.productId),
          gte(productPickups.collectedDate, fromDate),
        ),
      );
    for (const pickup of pickups) {
      if (
        !pickup.sectorId ||
        !pickup.collectedDate ||
        !pickup.collectedQuantity
      )
        continue;
      add({
        productId: key.productId,
        productName: pickup.productName,
        actorSectorId: pickup.sectorId,
        actorSectorName: pickup.sectorName,
        type: StockMovementTypeEnum.Pickup,
        sourceId: pickup.id,
        quantity: -Number(pickup.collectedQuantity),
        movementDate: parseDateOnly(pickup.collectedDate),
        createdAt: pickup.createdAt,
        sequence: 0,
      });
    }

    const loans = await db
      .select()
      .from(vasilhameLoans)
      .where(
        and(
          eq(vasilhameLoans.companyId, companyId),
          eq(vasilhameLoans.vasilhameId, key.productId),
        ),
      );
    for (const loan of loans) {
      if (!loan.sectorId) continue;
      if (loan.loanDate && parseDateOnly(loan.loanDate) >= fromDate)
        add({
          productId: key.productId,
          productName: loan.vasilhameName,
          actorSectorId: loan.sectorId,
          actorSectorName: loan.sectorName,
          type: StockMovementTypeEnum.Loan,
          sourceId: loan.id,
          quantity: -Number(loan.loanQuantity),
          movementDate: parseDateOnly(loan.loanDate),
          createdAt: loan.createdAt,
          sequence: 0,
        });
      if (
        loan.returnDate &&
        Number(loan.returnedQuantity ?? 0) > 0 &&
        parseDateOnly(loan.returnDate) >= fromDate
      )
        add({
          productId: key.productId,
          productName: loan.vasilhameName,
          actorSectorId: loan.sectorId,
          actorSectorName: loan.sectorName,
          type: StockMovementTypeEnum.Loan,
          sourceId: loan.id,
          quantity: Number(loan.returnedQuantity),
          movementDate: parseDateOnly(loan.returnDate),
          createdAt: loan.createdAt,
          sequence: 1,
        });
    }
    return events;
  }
}
