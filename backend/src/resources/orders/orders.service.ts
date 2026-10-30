import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq, isNull, isNotNull, or, sql } from "drizzle-orm";
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

  async list(
    page: number = 1,
    limit: number = 100,
    filters: Record<string, any> = {},
    search?: string,
    sort?: string,
    order: "asc" | "desc" = "desc",
    searchFields: string[] = ["name"],
  ) {
    const {
      effectiveDeliveryDate_gte: deliveryDateFrom,
      effectiveDeliveryDate_lte: deliveryDateTo,
      effectiveCreatedAt_gte: createdAtFrom,
      effectiveCreatedAt_lte: createdAtTo,
      ...otherFilters
    } = filters;

    if (
      !deliveryDateFrom &&
      !deliveryDateTo &&
      !createdAtFrom &&
      !createdAtTo
    ) {
      return super.list(
        page,
        limit,
        otherFilters,
        search,
        sort,
        order,
        searchFields,
      );
    }

    const dateConditions = [];
    if (deliveryDateFrom) {
      dateConditions.push(sql`${orders.deliveryDate} >= ${deliveryDateFrom}`);
    }
    if (deliveryDateTo) {
      dateConditions.push(sql`${orders.deliveryDate} <= ${deliveryDateTo}`);
    }

    const createdAtConditions = [];
    if (createdAtFrom) {
      createdAtConditions.push(sql`${orders.createdAt} >= ${createdAtFrom}`);
    }
    if (createdAtTo) {
      createdAtConditions.push(sql`${orders.createdAt} <= ${createdAtTo}`);
    }

    const effectiveDateConditions = [];
    if (dateConditions.length > 0) {
      effectiveDateConditions.push(
        and(isNotNull(orders.deliveryDate), ...dateConditions),
      );
    }
    if (createdAtConditions.length > 0) {
      effectiveDateConditions.push(
        and(isNull(orders.deliveryDate), ...createdAtConditions),
      );
    }

    const effectiveDateFilter = or(...effectiveDateConditions);
    if (!effectiveDateFilter) {
      throw new Error("Os filtros de data efetiva dos pedidos são inválidos.");
    }

    const where = sql`(${this.buildWhere(
      otherFilters,
      search,
      searchFields,
    )}) AND (${effectiveDateFilter})`;
    const [result, [totals]] = await Promise.all([
      this.listWithWhere(where, page, limit, sort, order),
      this.getDb()
        .select({
          totalAmount: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
        })
        .from(orders)
        .where(where),
    ]);

    return {
      ...result,
      totalAmount: Number(totals.totalAmount),
    };
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
