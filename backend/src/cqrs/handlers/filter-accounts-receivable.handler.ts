import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { FilterAccountsReceivableQuery } from "../queries/filter-accounts-receivable.query";
import { RequestContextService } from "../../database/request-context.service";
import { accountsReceivables, sales, persons } from "../../database/schemas";
import {
  eq,
  and,
  ilike,
  inArray,
  gte,
  lte,
  desc,
  asc,
  getTableColumns,
} from "drizzle-orm";

@QueryHandler(FilterAccountsReceivableQuery)
export class FilteraccountsReceivablesHandler implements IQueryHandler<FilterAccountsReceivableQuery> {
  constructor(private readonly requestContext: RequestContextService) {}

  async execute(query: FilterAccountsReceivableQuery): Promise<any[]> {
    const db = this.requestContext.getDb();
    if (!db) throw new Error("DB not available");

    const { filters, options, companyId } = query;
    const filterConditions: any[] = [
      eq(accountsReceivables.active, true),
      eq(accountsReceivables.companyId, companyId),
    ];

    // Apply filters
    if (filters.personId) {
      filterConditions.push(eq(accountsReceivables.personId, filters.personId));
    }

    if (filters.sectorId) {
      filterConditions.push(eq(sales.sectorId, filters.sectorId));
    }

    if (filters.paymentTypeId) {
      filterConditions.push(
        eq(accountsReceivables.paymentTypeId, filters.paymentTypeId),
      );
    }

    if (filters.status && filters.status.length > 0) {
      filterConditions.push(
        inArray(accountsReceivables.status, filters.status),
      );
    }

    if (filters.dueDate_gte) {
      filterConditions.push(
        gte(accountsReceivables.dueDate, new Date(filters.dueDate_gte)),
      );
    }

    if (filters.dueDate_lte) {
      filterConditions.push(
        lte(accountsReceivables.dueDate, new Date(filters.dueDate_lte)),
      );
    }

    if (filters.saleId) {
      filterConditions.push(
        ilike(accountsReceivables.saleId, `%${filters.saleId}%`),
      );
    }
    if (filters.id) {
      filterConditions.push(ilike(accountsReceivables.id, `%${filters.id}%`));
    }
    if (filters.nfeNumber) {
      filterConditions.push(ilike(sales.nfeNumber, `%${filters.nfeNumber}%`));
    }
    if (filters.personDocument) {
      filterConditions.push(
        ilike(persons.document, `%${filters.personDocument}%`),
      );
    }

    let where = and(...filterConditions);
    let sort = desc(accountsReceivables.dueDate);

    // Apply sorting
    if (options.sort) {
      const sortField = options.sort.startsWith("-")
        ? options.sort.slice(1)
        : options.sort;
      const sortDirection = options.sort.startsWith("-") ? desc : asc;

      // Map sort fields
      const sortMap: Record<string, any> = {
        dueDate: accountsReceivables.dueDate,
        amount: accountsReceivables.amount,
        id: accountsReceivables.id,
      };

      if (sortMap[sortField]) {
        sort = sortDirection(sortMap[sortField]);
      } else {
        // Default sort
        sort = desc(accountsReceivables.dueDate);
      }
    }

    // Build the base query
    let queryBuilder = db
      .select({
        ...getTableColumns(accountsReceivables),
        nfeNumber: sales.nfeNumber,
        sectorId: sales.sectorId,
        sectorName: sales.sectorName,
        personDocument: persons.document,
      })
      .from(accountsReceivables)
      .leftJoin(sales, eq(accountsReceivables.saleId, sales.id))
      .leftJoin(persons, eq(accountsReceivables.personId, persons.id))
      .where(where)
      .orderBy(sort);

    // Apply limit
    if (options.limit) {
      (queryBuilder as any).limit(options.limit);
    }

    const results = await queryBuilder;

    // Format the results (convert numeric fields to numbers)
    return results.map((row) => ({
      ...row,
      amount: Number(row.amount),
    }));
  }
}
