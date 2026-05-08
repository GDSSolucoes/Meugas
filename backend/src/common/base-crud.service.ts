import { Injectable } from "@nestjs/common";
import { and, eq, ilike, or, sql, desc, SQL } from "drizzle-orm";
import { RequestContextService } from "../database/request-context.service";
import { BaseCreateDto } from "./dto/base-create.dto";
import { BaseUpdateDto } from "./dto/base-update.dto";
import { AnyPgColumn, PgTableWithColumns } from "drizzle-orm/pg-core";

// Configuramos a estrutura interna que o Drizzle espera de uma tabela
export type BaseTableConfig = {
  name: string;
  schema: string | undefined;
  dialect: 'pg';
  columns: {
    // 1. Colunas OBRIGATÓRIAS que seu motor genérico usa
    id: AnyPgColumn;
    active: AnyPgColumn;
    createdAt: AnyPgColumn;
    
    
  };
};

// Criamos o tipo da tabela que será usado no T do seu Service
export type BasePgTable = PgTableWithColumns<BaseTableConfig>;

@Injectable()
export class BaseCrudService<T extends BasePgTable> {
  constructor(
    protected readonly requestContext: RequestContextService,
    protected readonly table: T, // Drizzle table
    protected readonly hasCompanyId: boolean = true,
  ) {}

  protected getDb() {
    const db = this.requestContext.getDb();
    if (!db) {
      throw new Error(
        "Database context not available. Make sure RLS interceptor is active.",
      );
    }
    return db;
  }

  protected getBaseWhere(): SQL {
    // O RLS já filtra por company_id automaticamente quando políticas estão ativas
    // Apenas filtramos por active = true
    return eq(this.table.active, true);
  }

  async list(
    page: number = 1,
    limit: number = 10,
    filters: Record<string, any> = {},
    search?: string,
    searchFields: string[] = ["name"],
  ) {
    const db = this.getDb();
    const offset = (page - 1) * limit;
    let where = this.getBaseWhere();

    // Add filters
    const filterConditions: any[] = [];
    for (const [key, value] of Object.entries(filters)) {
      if (key.endsWith("_like")) {
        const field = key.replace("_like", "");
        const column = (this.table as any)[field];
        if (column) {
          filterConditions.push(ilike(column, `%${value}%`));
        }
      } else if (key.endsWith("_gt")) {
        const field = key.replace("_gt", "");
        const column = (this.table as any)[field];
        if (column) {
          filterConditions.push(sql`${column} > ${value}`);
        }
      } else if (key.endsWith("_lt")) {
        const field = key.replace("_lt", "");
        const column = (this.table as any)[field];
        if (column) {
          filterConditions.push(sql`${column} < ${value}`);
        }
      } else if (key.endsWith("_eq")) {
        const field = key.replace("_eq", "");
        const column = (this.table as any)[field];
        if (column) {
          filterConditions.push(eq(column, value));
        }
      }
    }

    if (filterConditions.length > 0) {
      where = and(where, ...filterConditions) as SQL<boolean>;
    }

    // Add search
    if (search && search.length > 1 && searchFields.length > 0) {
      const searchConditions = searchFields.map((field) =>
        ilike((this.table as any)[field], `%${search}%`),
      );
      where = and(where, or(...searchConditions)) as SQL<boolean>;
    }

    const result = await db
      .select()
      .from(this.table as any)
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(desc((this.table as any).createdAt));

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(this.table as any)
      .where(where);

    return {
      data: result,
      total: total[0].count,
      page,
      limit,
      totalPages: Math.ceil(total[0].count / limit),
    };
  }

  async get(id: string) {
    const db = this.getDb();
    const rows = await db
      .select()
      .from(this.table as any)
      .where(and(this.getBaseWhere(), eq((this.table as any).id, id)));
    return (rows as any[])[0] || null;
  }

  async create(data: BaseCreateDto) {
    const db = this.getDb();
    const companyId = this.requestContext.getCompanyId();
    const insertData: any = { ...data };

    // Injetar companyId automaticamente do contexto RLS
    if (this.hasCompanyId && companyId) {
      insertData.companyId = companyId;
    }

    const result = await db.insert(this.table as any).values(insertData).returning();
    return (result as any[])[0];
  }

  async update(id: string, data: Partial<BaseUpdateDto>) {
    const db = this.getDb();
    const result = await db
      .update(this.table as any)
      .set(data as any)
      .where(and(this.getBaseWhere(), eq((this.table as any).id, id)))
      .returning();
    return (result as any[])[0];
  }

  async delete(id: string) {
    const db = this.getDb();
    const result = await db
      .update(this.table as any)
      .set({ active: false } as any)
      .where(and(this.getBaseWhere(), eq((this.table as any).id, id)))
      .returning();
    return (result as any[])[0];
  }
}
