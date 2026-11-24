import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, eq, isNull, isNotNull, or, sql } from "drizzle-orm";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import {
  employees,
  EmployeePositionEnum,
  orderItems,
  orders,
  OrdersStatusEnum,
  sectors,
  sales,
} from "../../database/schemas";
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
      excludeSold,
      ...otherFilters
    } = filters;

    const shouldExcludeSold = excludeSold === true || excludeSold === "true";
    const hasEffectiveDateFilters =
      deliveryDateFrom || deliveryDateTo || createdAtFrom || createdAtTo;

    if (
      !hasEffectiveDateFilters &&
      !shouldExcludeSold
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

    const effectiveDateFilter = hasEffectiveDateFilters
      ? or(...effectiveDateConditions)
      : undefined;
    if (hasEffectiveDateFilters && !effectiveDateFilter) {
      throw new Error("Os filtros de data efetiva dos pedidos são inválidos.");
    }

    const baseWhere = this.buildWhere(otherFilters, search, searchFields);
    const where =
      and(
        baseWhere,
        shouldExcludeSold
          ? sql`NOT EXISTS (
              SELECT 1
              FROM ${sales}
              WHERE ${sales.orderId} = ${orders.id}
                AND ${sales.companyId} = ${orders.companyId}
                AND ${sales.active} = true
            )`
          : undefined,
        effectiveDateFilter,
      ) ?? baseWhere;
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
  async create(
    data: OrderCreateDto,
    user?: { companyId: string },
  ) {
    if (!user) {
      throw new BadRequestException("Usuário autenticado não encontrado.");
    }

    if (!data.employeeId) {
      throw new BadRequestException("Selecione um entregador para o pedido.");
    }

    const [employee] = await this.getDb()
      .select({ id: employees.id, sectorId: employees.sectorId })
      .from(employees)
      .where(
        and(
          eq(employees.id, data.employeeId),
          eq(employees.companyId, user.companyId),
          eq(employees.active, true),
          eq(employees.position, EmployeePositionEnum.ENTREGADOR),
        ),
      )
      .limit(1);
    if (!employee) {
      throw new BadRequestException("Selecione um entregador válido.");
    }

    const sectorId = employee.sectorId;
    if (!sectorId) {
      throw new BadRequestException(
        "O entregador selecionado não está vinculado a um setor.",
      );
    }

    const [sector] = await this.getDb()
      .select({ id: sectors.id })
      .from(sectors)
      .where(
        and(eq(sectors.id, sectorId), eq(sectors.companyId, user.companyId)),
      )
      .limit(1);
    if (!sector) {
      throw new BadRequestException(
        "O setor do entregador não pertence à empresa.",
      );
    }

    const orderToCreate: OrderCreateDto = { ...data, sectorId };
    const savedOrder = await super.create(orderToCreate);
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
    let updateData = data;
    if (data.employeeId !== undefined || data.sectorId !== undefined) {
      const companyId = this.requestContext.getCompanyId();
      const [existingOrder] = await this.getDb()
        .select({ employeeId: orders.employeeId })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (!existingOrder) {
        throw new NotFoundException("Pedido não encontrado.");
      }

      const employeeId = data.employeeId ?? existingOrder.employeeId;
      if (!employeeId) {
        throw new BadRequestException(
          "Selecione um entregador para o pedido.",
        );
      }

      const [employee] = await this.getDb()
        .select({
          id: employees.id,
          name: employees.name,
          sectorId: employees.sectorId,
        })
        .from(employees)
        .where(
          and(
            eq(employees.id, employeeId),
            eq(employees.active, true),
            eq(employees.position, EmployeePositionEnum.ENTREGADOR),
            ...(companyId ? [eq(employees.companyId, companyId)] : []),
          ),
        )
        .limit(1);

      if (!employee) {
        throw new BadRequestException("Selecione um entregador válido.");
      }
      if (!employee.sectorId) {
        throw new BadRequestException(
          "O entregador selecionado não está vinculado a um setor.",
        );
      }

      const [sector] = await this.getDb()
        .select({ id: sectors.id })
        .from(sectors)
        .where(
          and(
            eq(sectors.id, employee.sectorId),
            ...(companyId ? [eq(sectors.companyId, companyId)] : []),
          ),
        )
        .limit(1);
      if (!sector) {
        throw new BadRequestException(
          "O setor do entregador não pertence à empresa.",
        );
      }

      updateData = {
        ...data,
        employeeId: employee.id,
        employeeName: employee.name,
        sectorId: employee.sectorId,
      };
    }

    const updatedOrder = await super.update(id, updateData);

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
