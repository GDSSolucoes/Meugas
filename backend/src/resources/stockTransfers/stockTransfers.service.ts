import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq, gte, sql } from "drizzle-orm";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import {
  productStocks,
  products,
  sectors,
  stockTransfers,
  productStockMovements,
  StockMovementTypeEnum,
} from "../../database/schemas";
import { StocktransferCreateDto } from "./dto/stocktransfer.post.dto";
import { StocktransferUpdateDto } from "./dto/stocktransfer.update.dto";
import { parseDateOnly } from "../../database/schemas/date-only";

@Injectable()
export class StocktransfersService extends BaseCrudService<
  typeof stockTransfers
> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, stockTransfers, true); // hasCompanyId = true
  }

  async create(data: StocktransferCreateDto) {
    const db = this.getDb();
    const companyId = this.requestContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException(
        "Empresa não encontrada no contexto da solicitação",
      );
    }

    if (data.fromSectorId === data.toSectorId) {
      throw new BadRequestException(
        "Os setores de origem e destino não podem ser iguais",
      );
    }

    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, data.productId),
          eq(products.companyId, companyId),
          eq(products.active, true),
        ),
      )
      .limit(1);
    if (!product)
      throw new NotFoundException("Produto não encontrado ou inativo");

    const selectedSectors = await db
      .select()
      .from(sectors)
      .where(
        and(
          eq(sectors.companyId, companyId),
          eq(sectors.active, true),
          sql`${sectors.id} in (${data.fromSectorId}, ${data.toSectorId})`,
        ),
      );
    const fromSector = selectedSectors.find(
      (sector) => sector.id === data.fromSectorId,
    );
    const toSector = selectedSectors.find(
      (sector) => sector.id === data.toSectorId,
    );
    if (!fromSector || !toSector) {
      throw new NotFoundException(
        "Setor de origem ou destino não encontrado ou inativo",
      );
    }

    const ownerSectorId = (sector: {
      id: string;
      isOwnStock: boolean | null;
      masterSectorId: string | null;
    }) =>
      sector.isOwnStock ? sector.id : (sector.masterSectorId ?? sector.id);
    const fromOwnerSectorId = ownerSectorId(fromSector);
    const toOwnerSectorId = ownerSectorId(toSector);
    if (fromOwnerSectorId === toOwnerSectorId) {
      throw new BadRequestException(
        "Os setores de origem e destino pertencem ao mesmo estoque proprietário",
      );
    }

    const [fromStock] = await db
      .select()
      .from(productStocks)
      .where(
        and(
          eq(productStocks.companyId, companyId),
          eq(productStocks.productId, data.productId),
          eq(productStocks.sectorId, fromOwnerSectorId),
          eq(productStocks.active, true),
        ),
      )
      .limit(1);
    const availableStock = Number(fromStock?.quantity ?? 0);
    if (data.quantity > availableStock) {
      throw new BadRequestException(
        `Quantidade insuficiente. Estoque disponível: ${availableStock}`,
      );
    }

    const transferDate = data.transferDate ?? parseDateOnly(new Date());
    const [savedTransfer] = await db
      .insert(stockTransfers)
      .values({
        ...data,
        productName: product.name,
        fromSectorName: fromSector.name,
        toSectorName: toSector.name,
        transferNumber: data.transferNumber?.trim() || `TRF-${Date.now()}`,
        transferDate,
        companyId,
        active: true,
      })
      .returning();

    const previousFromBalance = availableStock;
    const newFromBalance = previousFromBalance - data.quantity;
    const updatedFromStock = await db
      .update(productStocks)
      .set({ quantity: sql`${productStocks.quantity} - ${data.quantity}` })
      .where(
        and(
          eq(productStocks.id, fromStock.id),
          gte(productStocks.quantity, data.quantity),
        ),
      )
      .returning();
    if (updatedFromStock.length === 0) {
      throw new BadRequestException(
        "O estoque de origem foi alterado; tente novamente",
      );
    }

    const [toStock] = await db
      .select()
      .from(productStocks)
      .where(
        and(
          eq(productStocks.companyId, companyId),
          eq(productStocks.productId, data.productId),
          eq(productStocks.sectorId, toOwnerSectorId),
          eq(productStocks.active, true),
        ),
      )
      .limit(1);
    const previousToBalance = Number(toStock?.quantity ?? 0);
    const newToBalance = previousToBalance + data.quantity;
    if (toStock) {
      await db
        .update(productStocks)
        .set({ quantity: sql`${productStocks.quantity} + ${data.quantity}` })
        .where(eq(productStocks.id, toStock.id));
    } else {
      await db.insert(productStocks).values({
        productId: data.productId,
        productName: product.name,
        sectorId: toOwnerSectorId,
        sectorName: toSector.name,
        quantity: data.quantity,
        initialDate: transferDate,
        companyId,
        createdByName: data.createdByName,
        active: true,
      });
    }

    await db.insert(productStockMovements).values([
      {
        productId: data.productId,
        productName: product.name,
        sectorId: fromSector.id,
        sectorName: fromSector.name,
        actorSectorId: fromSector.id,
        ownerSectorId: fromOwnerSectorId,
        type: StockMovementTypeEnum.Transfer,
        stockTransferId: savedTransfer.id,
        quantity: -data.quantity,
        previousBalance: previousFromBalance,
        newBalance: newFromBalance,
        movementDate: transferDate,
        companyId,
        companyName: data.companyName,
        createdByName: data.createdByName,
      },
      {
        productId: data.productId,
        productName: product.name,
        sectorId: toSector.id,
        sectorName: toSector.name,
        actorSectorId: toSector.id,
        ownerSectorId: toOwnerSectorId,
        type: StockMovementTypeEnum.Transfer,
        stockTransferId: savedTransfer.id,
        quantity: data.quantity,
        previousBalance: previousToBalance,
        newBalance: newToBalance,
        movementDate: transferDate,
        companyId,
        companyName: data.companyName,
        createdByName: data.createdByName,
      },
    ]);

    return savedTransfer;
  }

  async update(id: string, data: Partial<StocktransferUpdateDto>) {
    return super.update(id, data);
  }
}
