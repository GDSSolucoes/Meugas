import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import {
  orderItems,
  orders,
  OrdersStatusEnum,
  productStockMovements,
  productStocks,
  sectors,
  StockMovementTypeEnum,
} from "../../database/schemas";
import { OrderCreateDto } from './dto/order.post.dto'
import { OrderUpdateDto } from './dto/order.update.dto'

@Injectable()
export class OrdersService extends BaseCrudService<typeof orders> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, orders, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: OrderCreateDto) {
    const savedOrder = await super.create(data)
    if (savedOrder?.id && data.items?.length) {
      await this.getDb().insert(orderItems).values(
        data.items.map((item) => ({
          orderId: savedOrder.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          total: item.total,
          companyId: savedOrder.companyId,
          companyName: savedOrder.companyName,
        })),
      )
    }

    return savedOrder
  }

  async update(id: string, data: Partial<OrderUpdateDto>) {
    const updatedOrder = await super.update(id, data)

    if (updatedOrder?.id && data.items !== undefined) {
      const db = this.getDb()
      await db.delete(orderItems).where(eq(orderItems.orderId, id))

      if (data.items.length > 0) {
        await db.insert(orderItems).values(
          data.items.map((item) => ({
            orderId: updatedOrder.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
            companyId: updatedOrder.companyId,
            companyName: updatedOrder.companyName,
          })),
        )
      }
    }

    return updatedOrder
  }

  async finalize(id: string) {
    const db = this.getDb();
    const companyId = this.requestContext.getCompanyId();
    if (!companyId) {
      throw new BadRequestException("Empresa não encontrada no contexto.");
    }

    return db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.id, id),
            eq(orders.companyId, companyId),
            eq(orders.active, true),
          ),
        )
        .limit(1)
        .for("update");

      if (!order) throw new NotFoundException("Pedido não encontrado.");
      if (order.status === "finalizado") {
        throw new ConflictException("Este pedido já foi finalizado.");
      }
      if (order.status !== "em_atendimento") {
        throw new BadRequestException(
          "Somente pedidos em atendimento podem ser finalizados.",
        );
      }
      if (!order.sectorId) {
        throw new BadRequestException(
          "Selecione um setor de estoque antes de finalizar o pedido.",
        );
      }

      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      if (!items.length) {
        throw new BadRequestException("O pedido não possui itens para baixar.");
      }

      const [actorSector] = await tx
        .select()
        .from(sectors)
        .where(
          and(
            eq(sectors.id, order.sectorId),
            eq(sectors.companyId, companyId),
            eq(sectors.active, true),
          ),
        )
        .limit(1);
      if (!actorSector) {
        throw new BadRequestException(
          "O setor associado ao pedido não está disponível.",
        );
      }

      const ownerSectorId = actorSector.isOwnStock
        ? actorSector.id
        : actorSector.masterSectorId;
      if (!ownerSectorId) {
        throw new BadRequestException(
          "O setor selecionado não possui um setor de estoque vinculado.",
        );
      }

      const [ownerSector] = await tx
        .select()
        .from(sectors)
        .where(
          and(
            eq(sectors.id, ownerSectorId),
            eq(sectors.companyId, companyId),
            eq(sectors.active, true),
          ),
        )
        .limit(1);
      if (!ownerSector?.isOwnStock) {
        throw new BadRequestException(
          "O setor de estoque vinculado não está disponível.",
        );
      }

      for (const item of items) {
        const quantity = Number(item.quantity);
        if (!item.productId || !Number.isFinite(quantity) || quantity <= 0) {
          throw new BadRequestException(
            "O pedido contém um produto ou uma quantidade inválida.",
          );
        }

        const [stock] = await tx
          .select()
          .from(productStocks)
          .where(
            and(
              eq(productStocks.productId, item.productId),
              eq(productStocks.sectorId, ownerSector.id),
              eq(productStocks.companyId, companyId),
              eq(productStocks.active, true),
            ),
          )
          .limit(1);

        const previousBalance = Number(stock?.quantity ?? 0);
        const newBalance = previousBalance - quantity;

        await tx
          .insert(productStocks)
          .values({
            productId: item.productId,
            productName: item.productName,
            sectorId: ownerSector.id,
            sectorName: ownerSector.name,
            quantity: -quantity,
            initialDate: new Date(),
            companyId,
            companyName: order.companyName,
            createdByName: order.createdByName,
          })
          .onConflictDoUpdate({
            target: [productStocks.productId, productStocks.sectorId],
            set: {
              quantity: sql`${productStocks.quantity} - ${quantity}`,
            },
          });

        await tx.insert(productStockMovements).values({
          type: StockMovementTypeEnum.Order,
          productId: item.productId,
          productName: item.productName,
          sectorId: actorSector.id,
          sectorName: actorSector.name,
          actorSectorId: actorSector.id,
          ownerSectorId: ownerSector.id,
          orderId: order.id,
          quantity: -quantity,
          previousBalance,
          newBalance,
          movementDate: new Date(),
          companyId,
          companyName: order.companyName,
          createdByName: order.createdByName,
        });
      }

      const [finalizedOrder] = await tx
        .update(orders)
        .set({
          status: OrdersStatusEnum.FINALIZADO,
          finalizedAt: new Date(),
        })
        .where(eq(orders.id, order.id))
        .returning();

      return finalizedOrder;
    });
  }
}
