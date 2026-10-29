import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import { orderItems, orders, OrdersStatusEnum } from "../../database/schemas";
import { OrderCreateDto } from "./dto/order.post.dto";
import { OrderUpdateDto } from "./dto/order.update.dto";

@Injectable()
export class OrdersService extends BaseCrudService<typeof orders> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, orders, true); // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: OrderCreateDto) {
    const savedOrder = await super.create(data);
    if (savedOrder?.id && data.items?.length) {
      await this.getDb()
        .insert(orderItems)
        .values(
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
        );
    }

    return savedOrder;
  }

  async update(id: string, data: Partial<OrderUpdateDto>) {
    const updatedOrder = await super.update(id, data);

    if (updatedOrder?.id && data.items !== undefined) {
      const db = this.getDb();
      await db.delete(orderItems).where(eq(orderItems.orderId, id));

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
        );
      }
    }

    return updatedOrder;
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
