import { Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq, sql } from "drizzle-orm";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import { cashAccounts, cashMovements } from "../../database/schemas";
import { CashmovementCreateDto } from "./dto/cashmovement.post.dto";
import { CashmovementUpdateDto } from "./dto/cashmovement.update.dto";

@Injectable()
export class CashmovementsService extends BaseCrudService<
  typeof cashMovements
> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, cashMovements, true); // hasCompanyId = true
  }

  async create(data: CashmovementCreateDto) {
    return super.create(data);
  }

  async update(id: string, data: Partial<CashmovementUpdateDto>) {
    return super.update(id, data);
  }

  async getCashFlowSummary({
    cashAccountId,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    type,
  }: {
    cashAccountId: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    type?: string;
  }) {
    if (!cashAccountId) {
      throw new NotFoundException("cashAccountId is required");
    }

    const db = this.getDb();
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 10);
    const offset = (safePage - 1) * safeLimit;

    const accountRows = await db
      .select()
      .from(cashAccounts)
      .where(
        and(eq(cashAccounts.id, cashAccountId), eq(cashAccounts.active, true)),
      )
      .limit(1);

    const account = accountRows[0];
    if (!account) {
      throw new NotFoundException("Cash account not found");
    }

    const openingWhere = [
      eq(cashMovements.cashAccountId, cashAccountId),
      eq(cashMovements.active, true),
    ];

    if (startDate) {
      openingWhere.push(sql`${cashMovements.movementDate} < ${startDate}`);
    }

    if (type) {
      openingWhere.push(eq(cashMovements.type, type as any));
    }

    const openingRows = await db
      .select()
      .from(cashMovements)
      .where(and(...openingWhere))
      .orderBy(asc(cashMovements.movementDate), asc(cashMovements.createdAt));

    const openingBalance =
      Number(account.initialBalance || 0) +
      openingRows.reduce((sum, movement) => {
        const amount = Number(movement.amount || 0);
        return sum + (movement.type === "receita" ? amount : -amount);
      }, 0);

    const periodWhere = [
      eq(cashMovements.cashAccountId, cashAccountId),
      eq(cashMovements.active, true),
    ];

    if (type) {
      periodWhere.push(eq(cashMovements.type, type as any));
    }

    if (startDate) {
      periodWhere.push(sql`${cashMovements.movementDate} >= ${startDate}`);
    }

    if (endDate) {
      periodWhere.push(sql`${cashMovements.movementDate} <= ${endDate}`);
    }

    const periodRows = await db
      .select()
      .from(cashMovements)
      .where(and(...periodWhere))
      .orderBy(asc(cashMovements.movementDate), asc(cashMovements.createdAt));

    const total = periodRows.length;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const paginatedRows = periodRows.slice(offset, offset + safeLimit);

    const receitas = periodRows
      .filter((movement) => movement.type === "receita")
      .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);

    const despesas = periodRows
      .filter((movement) => movement.type === "despesa")
      .reduce((sum, movement) => sum + Number(movement.amount || 0), 0);

    const currentBalance = openingBalance + receitas - despesas;

    return {
      data: paginatedRows,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      openingBalance,
      currentBalance,
      receitas,
      despesas,
    };
  }
}
