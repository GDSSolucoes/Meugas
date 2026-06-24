import { Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, ilike, or, sql, desc, asc } from "drizzle-orm";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import { 
  accountsReceivables, 
  sales, 
  persons, 
  financialGroups, 
  cashAccounts, 
  cashMovements, 
  FinancialGroupTypeEnum,
  CashMovementTypeEnum,
  AccountsReceivableStatusEnum
} from "../../database/schemas";
import { AccountsReceivablesCreateDto } from "./dto/accountsreceivables.post.dto";
import { AccountsReceivablesUpdateDto } from "./dto/accountsreceivables.update.dto";
import { AccountsReceivablesRegisterPaymentDto } from "./dto/accountsreceivables.register-payment.dto";

@Injectable()
export class AccountsReceivablesService extends BaseCrudService<
  typeof accountsReceivables
> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, accountsReceivables, true); // hasCompanyId = true
  }

  // Override list method with custom joins and filtering
  async list(
    page: number = 1,
    limit: number = 100,
    filters: Record<string, any> = {},
    search?: string,
    sort?: string,
    order: "asc" | "desc" = "desc",
    searchFields: string[] = ["name"],
  ) {
    const db = this.getDb();
    const offset = (page - 1) * limit;
    let where = this.getBaseWhere(); // active = true

    const filterConditions: any[] = [];

    // Process filters
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) continue;
      
      // Normalize value to array for easier processing
      const values = Array.isArray(value) ? value : String(value).split(",").map((item) => item.trim()).filter(Boolean);
      if (values.length === 0) continue;

      // Direct filters on accountsReceivables
      if (["personId", "cashAccountId", "paymentTypeId", "status"].includes(key)) {
        const column = (this.table as any)[key];
        if (column) {
          if (values.length === 1) {
            filterConditions.push(eq(column, values[0]));
          } else {
            filterConditions.push(or(...values.map((item) => eq(column, item))));
          }
        }
        continue;
      }

      // Filters that use joins
      if (key === "nfeNumber") {
        filterConditions.push(ilike(sales.nfeNumber, `%${values[0]}%`));
        continue;
      }
      if (key === "personDocument") {
        filterConditions.push(ilike(persons.document, `%${values[0]}%`));
        continue;
      }
      if (key === "sectorId") {
        filterConditions.push(eq(sales.sectorId, values[0]));
        continue;
      }
      if (key === "saleId") {
        filterConditions.push(ilike(accountsReceivables.saleId, `%${values[0]}%`));
        continue;
      }
      if (key === "id") {
        filterConditions.push(ilike(accountsReceivables.id, `%${values[0]}%`));
        continue;
      }
      
      // Date range filters
      if (key === "dueDate_gte") {
        const column = (this.table as any)["dueDate"];
        if (column) {
          filterConditions.push(sql`${column} >= ${values[0]}`);
        }
        continue;
      }
      if (key === "dueDate_lte") {
        const column = (this.table as any)["dueDate"];
        if (column) {
          filterConditions.push(sql`${column} <= ${values[0]}`);
        }
        continue;
      }

      // Standard filters on accountsReceivables
      if (key.endsWith("_like")) {
        const field = key.replace("_like", "");
        const column = (this.table as any)[field];
        if (column) {
          filterConditions.push(ilike(column, `%${values[0]}%`));
        }
        continue;
      }

      if (key.endsWith("_eq")) {
        const field = key.replace("_eq", "");
        const column = (this.table as any)[field];
        if (column) {
          filterConditions.push(eq(column, values[0]));
        }
        continue;
      }
      
      const column = (this.table as any)[key];
      if (column) {
        if (values.length === 1) {
          filterConditions.push(eq(column, values[0]));
        } else {
          filterConditions.push(or(...values.map((item) => eq(column, item))));
        }
      }
    }

    if (filterConditions.length > 0) {
      where = and(where, ...filterConditions) as any;
    }

    // Build the query with joins
    let query: any = db
      .select({
        ...Object.fromEntries(
          Object.keys(this.table).map((key) => [key, (this.table as any)[key]])
        ),
        // Join fields from sales
        nfeNumber: sales.nfeNumber,
        sectorId: sales.sectorId,
        // Join fields from persons
        personDocument: persons.document,
      })
      .from(accountsReceivables)
      .leftJoin(sales, eq(accountsReceivables.saleId, sales.id))
      .leftJoin(persons, eq(accountsReceivables.personId, persons.id))
      .where(where)
      .limit(limit)
      .offset(offset);

    // Sorting
    if (sort) {
      // Check which table the sort column is in
      if (["nfeNumber", "sectorId"].includes(sort)) {
        const sortColumn = (sales as any)[sort];
        query = query.orderBy(
          order === "asc" ? asc(sortColumn) : desc(sortColumn),
        );
      } else if (sort === "personDocument") {
        const sortColumn = (persons as any)[sort];
        query = query.orderBy(
          order === "asc" ? asc(sortColumn) : desc(sortColumn),
        );
      } else if ((this.table as any)[sort]) {
        const sortColumn = (this.table as any)[sort];
        query = query.orderBy(
          order === "asc" ? asc(sortColumn) : desc(sortColumn),
        );
      }
    } else {
      query = query.orderBy(desc((this.table as any).createdAt));
    }

    const result = await query;

    // Get total count
    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(accountsReceivables)
      .leftJoin(sales, eq(accountsReceivables.saleId, sales.id))
      .leftJoin(persons, eq(accountsReceivables.personId, persons.id))
      .where(where);
    const total = await totalQuery;

    return {
      data: result,
      total: total[0].count,
      page,
      limit,
      totalPages: Math.ceil(total[0].count / limit),
    };
  }

  // Override if needed for custom logic
  async create(data: AccountsReceivablesCreateDto) {
    return super.create(data);
  }

  async update(id: string, data: Partial<AccountsReceivablesUpdateDto>) {
    return super.update(id, data);
  }

  async registerPayment(data: AccountsReceivablesRegisterPaymentDto, userId: string, userName: string, companyId: string, companyName: string) {
    const db = this.getDb();

    // 1. Find the cash account
    const cashAccountResult = await db.select().from(cashAccounts).where(
      and(
        eq(cashAccounts.id, data.cashAccountId),
        eq(cashAccounts.companyId, companyId)
      )
    );

    if (cashAccountResult.length === 0) {
      throw new NotFoundException("Conta de caixa não encontrada");
    }

    const cashAccount = cashAccountResult[0];

    // 2. Find or create the financial group
    let revenueGroupResult = await db.select().from(financialGroups).where(
      and(
        eq(financialGroups.name, "Receitas de Contas a Receber"),
        eq(financialGroups.companyId, companyId)
      )
    );

    let revenueGroup;
    if (revenueGroupResult.length === 0) {
      [revenueGroup] = await db.insert(financialGroups).values({
        name: "Receitas de Contas a Receber",
        type: FinancialGroupTypeEnum.RECEITA,
        active: true,
        companyId: companyId,
        companyName: companyName,
        createdByName: userName,
      }).returning();
    } else {
      revenueGroup = revenueGroupResult[0];
    }

    // 3. Get all accounts receivable to update
    let totalPaid = 0;
    const accountsToProcess = [];

    for (const accountId of data.accountReceivableIds) {
      const accountResult = await db.select().from(accountsReceivables).where(
        and(
          eq(accountsReceivables.id, accountId),
          eq(accountsReceivables.companyId, companyId)
        )
      );

      if (accountResult.length === 0) continue;

      const account = accountResult[0];
      if (account.status === AccountsReceivableStatusEnum.PAGO) continue;

      accountsToProcess.push(account);
      totalPaid += Number(account.amount);
    }
    // 4. Process each account
    for (const account of accountsToProcess) {
      // Create cash movement
      await db.insert(cashMovements).values({
        cashAccountId: cashAccount.id,
        cashAccountName: cashAccount.name,
        type: CashMovementTypeEnum.RECEITA,
        description: `Recebimento: ${account.description}`,
        saleId: account.saleId,
        accountReceivableId: account.id,
        amount: account.amount,
        personId: account.personId,
        personName: account.personName,
        movementDate: new Date(data.paymentDate),
        groupId: revenueGroup.id,
        groupName: revenueGroup.name,
        companyId: companyId,
        companyName: companyName,
        createdByName: userName,
      });


      // Update account receivable status
      await db.update(accountsReceivables).set({
        status: AccountsReceivableStatusEnum.PAGO,
        paymentDate: new Date(data.paymentDate),
      }).where(eq(accountsReceivables.id, account.id));
    }

    // 5. Update cash account balance
    const newBalance = (cashAccount.balance || 0) + totalPaid;
    await db.update(cashAccounts).set({ balance: newBalance }).where(eq(cashAccounts.id, cashAccount.id));

    return {
      message: `${accountsToProcess.length} conta(s) baixada(s) com sucesso`,
      count: accountsToProcess.length,
      totalPaid: totalPaid,
    };
  }
}