import {
  pgTable,
  boolean,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";

export enum FinancialGroupTypeEnum {
  RECEITA = "receita",
  DESPESA = "despesa",
  MOVIMENTACAO = "movimentacao",
  INVESTIMENTO = "investimento",
}

export const financialGroupTypePGEnum = pgEnum(
  "financial_group_type",
  FinancialGroupTypeEnum,
);

export const financialGroups = pgTable(
  "financialGroups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: financialGroupTypePGEnum("type").notNull(),
    description: text("description"),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    companyName: text("company_name"),
    active: boolean("active").default(true),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => [
    pgPolicy("financialGroups_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("financialGroups_company_id_index").on(table.companyId),
    index("financialGroups_type_index").on(table.type),
    uniqueIndex("financialGroups_name_type_company_id_unique").on(
      table.name,
      table.type,
      table.companyId,
    ),
  ],
);
