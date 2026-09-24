import { Injectable } from "@nestjs/common";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import { and, eq, inArray } from "drizzle-orm";
import {
  budgetItems,
  budgets,
  persons,
  products,
} from "../../database/schemas";
import { BudgetCreateDto } from "./dto/budget.post.dto";
import { BudgetUpdateDto } from "./dto/budget.update.dto";

@Injectable()
export class BudgetsService extends BaseCrudService<typeof budgets> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, budgets, true); // hasCompanyId = true
  }

  async create(data: BudgetCreateDto) {
    const companyId = this.requestContext.getCompanyId();
    if (!companyId) throw new Error("Company ID not found in request context");

    await this.validateRelations(data, companyId, true);
    const { items, ...budgetData } = data;
    const savedBudget = (await super.create(budgetData as any)) as any;
    await this.replaceItems(
      savedBudget.id,
      items,
      companyId,
      savedBudget.companyName,
      savedBudget.createdByName,
    );
    return this.get(savedBudget.id);
  }

  async update(id: string, data: Partial<BudgetUpdateDto>) {
    const companyId = this.requestContext.getCompanyId();
    if (!companyId) throw new Error("Company ID not found in request context");

    if (data.personId || data.items) {
      await this.validateRelations(data as BudgetCreateDto, companyId);
    }

    const { items, ...budgetData } = data;
    const updatedBudget = (await super.update(id, budgetData as any)) as any;
    if (!updatedBudget) return null;
    if (items) {
      await this.replaceItems(
        id,
        items,
        companyId,
        updatedBudget.companyName,
        updatedBudget.createdByName,
      );
    }
    return this.get(id);
  }

  async get(id: string) {
    const budget = (await super.get(id)) as any;
    return budget ? this.withRelations(budget) : null;
  }

  async list(
    page = 1,
    limit = 100,
    filters: Record<string, any> = {},
    search?: string,
    sort?: string,
    order: "asc" | "desc" = "desc",
    searchFields: string[] = ["budgetNumber"],
  ) {
    const result = await super.list(
      page,
      limit,
      filters,
      search,
      sort,
      order,
      searchFields,
    );
    return {
      ...result,
      data: await Promise.all(
        (result.data as any[]).map((budget) => this.withRelations(budget)),
      ),
    };
  }

  private async validateRelations(
    data: Partial<BudgetCreateDto>,
    companyId: string,
    requireAll = false,
  ) {
    const db = this.getDb();
    if (data.personId) {
      const [person] = await db
        .select({ id: persons.id })
        .from(persons)
        .where(
          and(eq(persons.id, data.personId), eq(persons.companyId, companyId)),
        )
        .limit(1);
      if (!person)
        throw new Error("Cliente não encontrado ou não pertence à empresa");
    } else if (requireAll) {
      throw new Error("É necessário informar o cliente");
    }

    if (!data.items) {
      if (requireAll)
        throw new Error("É necessário informar os itens do orçamento");
      return;
    }
    if (data.items.length === 0)
      throw new Error("É necessário informar os itens do orçamento");
    const productIds = data.items.map((item) => item.productId);
    const validProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          inArray(products.id, productIds),
          eq(products.companyId, companyId),
        ),
      );
    if (validProducts.length !== new Set(productIds).size) {
      throw new Error(
        "Todos os produtos do orçamento devem estar cadastrados na empresa",
      );
    }
  }

  private async replaceItems(
    budgetId: string,
    items: BudgetCreateDto["items"],
    companyId: string,
    companyName?: string,
    createdByName?: string,
  ) {
    const db = this.getDb();
    await db.delete(budgetItems).where(eq(budgetItems.budgetId, budgetId));
    await db.insert(budgetItems).values(
      items.map((item) => ({
        budgetId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
        companyId,
        companyName,
        createdByName,
      })),
    );
  }

  private async withRelations(budget: any) {
    const db = this.getDb();
    const [person] = budget.personId
      ? await db
          .select()
          .from(persons)
          .where(eq(persons.id, budget.personId))
          .limit(1)
      : [];
    const rows = await db
      .select({ item: budgetItems, product: products })
      .from(budgetItems)
      .innerJoin(products, eq(products.id, budgetItems.productId))
      .where(eq(budgetItems.budgetId, budget.id));

    return {
      ...budget,
      customerData: person
        ? {
            name: person.name,
            ...(person.address || {}),
          }
        : null,
      items: rows.map(({ item, product }) => ({
        productId: item.productId,
        productCode: product.code,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    };
  }
}
