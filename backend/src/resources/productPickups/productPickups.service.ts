import { Injectable } from "@nestjs/common";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import {
  productPickups,
  productStocks,
  productStockMovements,
  StockMovementTypeEnum,
  ProductPickupStatusEnum,
  persons,
} from "../../database/schemas";
import { sectors } from "../../database/schemas";
import { ProductpickupCreateDto } from "./dto/productpickup.post.dto";
import { ProductpickupUpdateDto } from "./dto/productpickup.update.dto";
import { and, eq, or, sql, desc, asc, ilike } from "drizzle-orm";
import { parseDateOnly } from "../../database/schemas/date-only";

@Injectable()
export class ProductpickupsService extends BaseCrudService<
  typeof productPickups
> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, productPickups, true); // hasCompanyId = true
  }

  async create(data: ProductpickupCreateDto) {
    if (!data.pickupQuantity || data.pickupQuantity <= 0) {
      throw new Error("Quantidade a retirar deve ser maior que zero");
    }

    return super.create(data);
  }

  async darBaixa(
    id: string,
    data: {
      quantityToCollect: number;
      sectorId: string;
      sectorName?: string;
      collectedDate: string;
      notaFiscal?: string;
      pedido?: string;
    },
  ) {
    const db = this.getDb();
    const companyId = this.requestContext.getCompanyId();

    if (!companyId) {
      throw new Error(
        "Não foi possível encontrar a empresa no contexto da solicitação",
      );
    }

    // Obter o registro atual
    const currentPickupResult = await db
      .select()
      .from(productPickups)
      .where(eq(productPickups.id, id))
      .limit(1);

    if (!currentPickupResult || currentPickupResult.length === 0) {
      throw new Error("Registro de retirada não encontrado");
    }

    const currentPickup = currentPickupResult[0];

    // VALIDAÇÕES (antes de qualquer escrita no banco)
    if (currentPickup.status === ProductPickupStatusEnum.RETIRADO_TOTAL) {
      throw new Error("Este produto já foi totalmente retirado");
    }

    const quantityToCollect = data.quantityToCollect;
    const newCollectedQuantity =
      (currentPickup.collectedQuantity || 0) + quantityToCollect;

    if (quantityToCollect <= 0) {
      throw new Error("Informe uma quantidade válida para retirada");
    }

    const totalQuantityToPickup = currentPickup.pickupQuantity || 0;
    if (newCollectedQuantity > totalQuantityToPickup) {
      const pendente =
        totalQuantityToPickup - (currentPickup.collectedQuantity || 0);
      throw new Error(`Quantidade inválida. Máximo permitido: ${pendente}`);
    }

    if (!data.sectorId) {
      throw new Error("É necessário informar o setor para a retirada");
    }

    if (!data.collectedDate) {
      throw new Error("É necessário informar a data de retirada");
    }

    // VALIDAÇÕES CONCLUÍDAS - Agora pode gravar

    // Calcular novo status
    const newStatus =
      newCollectedQuantity >= totalQuantityToPickup
        ? ProductPickupStatusEnum.RETIRADO_TOTAL
        : ProductPickupStatusEnum.RETIRADO_PARCIAL;

    // Atualizar o productPickup
    const updatedData = {
      collectedQuantity: newCollectedQuantity,
      status: newStatus,
      sectorId: data.sectorId,
      sectorName: data.sectorName,
      collectedDate: data.collectedDate,
      notaFiscal: data.notaFiscal,
      pedido: data.pedido,
    };

    // Registrar movimentação de estoque
    if (quantityToCollect > 0 && currentPickup.productId && data.sectorId) {
      // Determine owner/actor sectors
      const [sector] = await db
        .select()
        .from(sectors)
        .where(eq(sectors.id, data.sectorId));
      const ownerSectorId = sector?.isOwnStock
        ? sector.id
        : (sector?.masterSectorId ?? data.sectorId);
      const [ownerSector] = ownerSectorId
        ? await db.select().from(sectors).where(eq(sectors.id, ownerSectorId))
        : [];
      const actorSectorId = data.sectorId;
      // Obter saldo anterior do produto para o ownerSectorId
      const currentStockResult = await db
        .select({ quantity: productStocks.quantity })
        .from(productStocks)
        .where(
          and(
            eq(productStocks.productId, currentPickup.productId),
            eq(productStocks.sectorId, ownerSectorId),
          ),
        );

      const previousBalance = currentStockResult[0]?.quantity ?? 0;
      const quantityToRemove = -quantityToCollect; // Negativo porque é saída
      const newBalance = previousBalance + quantityToRemove;

      await db.insert(productStockMovements).values({
        productId: currentPickup.productId as any,
        productName: currentPickup.productName,
        sectorId: data.sectorId as any,
        sectorName: data.sectorName,
        ownerSectorId,
        actorSectorId,
        type: StockMovementTypeEnum.Pickup,
        productPickupId: id as any,
        quantity: quantityToRemove,
        previousBalance,
        newBalance,
        movementDate: parseDateOnly(data.collectedDate)!,
        companyId: companyId as any,
        companyName: currentPickup.companyName,
      });

      // Upsert the productStocks using (productId, ownerSectorId)
      if (ownerSector?.isOwnStock) {
        await db
          .insert(productStocks)
          .values({
            productId: currentPickup.productId,
            productName: currentPickup.productName,
            sectorId: ownerSectorId,
            sectorName: ownerSector.name,
            quantity: newBalance,
            initialDate: new Date(),
            companyId,
            companyName: currentPickup.companyName,
          })
          .onConflictDoUpdate({
            target: [productStocks.productId, productStocks.sectorId],
            set: { quantity: newBalance },
          });
      }
    }

    // Atualizar o productPickup
    return super.update(id, updatedData);
  }

  async update(id: string, data: Partial<ProductpickupUpdateDto>) {
    const db = this.getDb();
    const companyId = this.requestContext.getCompanyId();

    if (!companyId) {
      throw new Error(
        "Não foi possível encontrar a empresa no contexto da solicitação",
      );
    }

    // Obter o registro atual
    const currentPickupResult = await db
      .select()
      .from(productPickups)
      .where(eq(productPickups.id, id))
      .limit(1);

    if (!currentPickupResult || currentPickupResult.length === 0) {
      throw new Error("Registro de retirada não encontrado");
    }

    const currentPickup = currentPickupResult[0];

    // VALIDAÇÕES (antes de qualquer escrita no banco)
    if (currentPickup.status === ProductPickupStatusEnum.RETIRADO_TOTAL) {
      throw new Error("Este produto já foi totalmente retirado");
    }

    const newCollectedQuantity =
      data.collectedQuantity || currentPickup.collectedQuantity || 0;

    const quantityToCollect =
      newCollectedQuantity - (currentPickup.collectedQuantity || 0);

    if (quantityToCollect <= 0) {
      throw new Error("Informe uma quantidade válida para retirada");
    }

    const totalQuantityToPickup = currentPickup.pickupQuantity || 0;
    if (newCollectedQuantity > totalQuantityToPickup) {
      const pendente =
        totalQuantityToPickup - (currentPickup.collectedQuantity || 0);
      throw new Error(`Quantidade inválida. Máximo permitido: ${pendente}`);
    }

    if (!data.sectorId) {
      throw new Error("É necessário informar o setor para a retirada");
    }

    if (!data.collectedDate) {
      throw new Error("É necessário informar a data de retirada");
    }

    // VALIDAÇÕES CONCLUÍDAS - Agora pode gravar

    // Calcular novo status
    const newStatus =
      newCollectedQuantity >= totalQuantityToPickup
        ? ProductPickupStatusEnum.RETIRADO_TOTAL
        : ProductPickupStatusEnum.RETIRADO_PARCIAL;

    // Atualizar collectedDate e status
    const updatedData: Partial<ProductpickupUpdateDto> = {
      ...data,
      collectedQuantity: newCollectedQuantity,
      status: newStatus,
    };

    // Registrar movimentação de estoque
    if (quantityToCollect > 0 && currentPickup.productId && data.sectorId) {
      const [sector] = await db
        .select()
        .from(sectors)
        .where(eq(sectors.id, data.sectorId));
      const ownerSectorId = sector?.isOwnStock
        ? data.sectorId
        : sector?.masterSectorId;
      const stockSectorId = ownerSectorId ?? data.sectorId;
      const [ownerSector] = ownerSectorId
        ? await db.select().from(sectors).where(eq(sectors.id, ownerSectorId))
        : [];
      const currentStockResult = await db
        .select({ quantity: productStocks.quantity })
        .from(productStocks)
        .where(
          and(
            eq(productStocks.productId, currentPickup.productId),
            eq(productStocks.sectorId, stockSectorId),
          ),
        );

      const previousBalance = currentStockResult[0]?.quantity ?? 0;
      const quantityToRemove = -quantityToCollect; // Negativo porque é saída
      const newBalance = previousBalance + quantityToRemove;

      await db.insert(productStockMovements).values({
        productId: currentPickup.productId as any,
        productName: currentPickup.productName,
        sectorId: data.sectorId as any,
        sectorName: data.sectorName,
        type: StockMovementTypeEnum.Pickup,
        productPickupId: id as any,
        quantity: quantityToRemove,
        previousBalance,
        newBalance,
        movementDate: parseDateOnly(data.collectedDate)!,
        companyId: companyId as any,
        companyName: currentPickup.companyName,
      });

      // Atualizar o estoque do produto
      if (ownerSector?.isOwnStock) {
        await db
          .update(productStocks)
          .set({ quantity: newBalance })
          .where(
            and(
              eq(productStocks.productId, currentPickup.productId),
              eq(productStocks.sectorId, stockSectorId),
            ),
          );
      }
    }

    return super.update(id, updatedData);
  }

  async search(params: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: "asc" | "desc";
    personId?: string;
    personTypes?: string[];
    productId?: string;
    saleId?: string;
    periodType?: "aRetirar" | "retiradosEntre";
    startDate?: string;
    endDate?: string;
    q?: string;
  }) {
    const db = this.getDb();
    const companyId = this.requestContext.getCompanyId();

    if (!companyId) {
      throw new Error(
        "Não foi possível encontrar a empresa no contexto da solicitação",
      );
    }

    const page = params.page || 1;
    const limit = params.limit || 100;
    const offset = (page - 1) * limit;
    const orderDir = params.order === "asc" ? asc : desc;

    const conditions: any[] = [eq(productPickups.active, true)];

    if (params.personId) {
      conditions.push(eq(productPickups.personId, params.personId));
    }

    if (params.personTypes && params.personTypes.length > 0) {
      const typeConditions = params.personTypes.map((t) =>
        eq(persons.type, t as any),
      );
      conditions.push(or(...typeConditions));
    }

    if (params.productId) {
      conditions.push(eq(productPickups.productId, params.productId));
    }

    if (params.saleId) {
      conditions.push(eq(productPickups.saleId, params.saleId));
    }

    if (params.periodType === "aRetirar") {
      conditions.push(
        or(
          eq(productPickups.status, ProductPickupStatusEnum.PENDENTE),
          and(
            eq(
              productPickups.status,
              ProductPickupStatusEnum.RETIRADO_PARCIAL,
            ),
            sql`${productPickups.pickupQuantity} > ${productPickups.collectedQuantity}`,
          ),
        ),
      );
    } else if (params.periodType === "retiradosEntre") {
      conditions.push(
        sql`${productPickups.collectedQuantity} > 0`,
      );
      if (params.startDate) {
        conditions.push(
          sql`${productPickups.collectedDate} >= ${params.startDate}`,
        );
      }
      if (params.endDate) {
        conditions.push(
          sql`${productPickups.collectedDate} <= ${params.endDate}`,
        );
      }
    }

    if (params.q) {
      const searchTerm = `%${params.q}%`;
      conditions.push(
        or(
          ilike(productPickups.personName, searchTerm),
          ilike(productPickups.productName, searchTerm),
        ),
      );
    }

    const whereClause = and(...conditions);

    let sortColumn: any = productPickups.createdAt;
    if (params.sort) {
      const col = (productPickups as any)[params.sort];
      if (col) sortColumn = col;
    } else {
      sortColumn = productPickups.saleDate;
    }

    const baseQuery = db
      .select()
      .from(productPickups)
      .leftJoin(persons, eq(productPickups.personId, persons.id))
      .where(whereClause);

    const dataQuery = baseQuery
      .orderBy(orderDir(sortColumn))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(distinct ${productPickups.id})` })
      .from(productPickups)
      .leftJoin(persons, eq(productPickups.personId, persons.id))
      .where(whereClause);

    const [rows, countResult] = await Promise.all([dataQuery, countQuery]);

    const data = rows.map((row: any) => row.productPickups);
    const total = countResult[0]?.count || 0;

    const totalsResult = await db
      .select({
        totalARetirar:
          sql<number>`sum(CASE WHEN ${productPickups.status} <> ${ProductPickupStatusEnum.RETIRADO_TOTAL} THEN (${productPickups.pickupQuantity} - ${productPickups.collectedQuantity}) ELSE 0 END)`,
        totalRetirados:
          sql<number>`sum(CASE WHEN ${productPickups.status} = ${ProductPickupStatusEnum.RETIRADO_TOTAL} THEN ${productPickups.collectedQuantity} ELSE 0 END)`,
      })
      .from(productPickups)
      .leftJoin(persons, eq(productPickups.personId, persons.id))
      .where(whereClause);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalARetirar: totalsResult[0]?.totalARetirar || 0,
      totalRetirados: totalsResult[0]?.totalRetirados || 0,
    };
  }
}
