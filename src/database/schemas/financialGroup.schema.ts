import {
  pgTable,
  boolean,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
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

export const financialGroupTypePGEnum = pgEnum("financial_group_type", FinancialGroupTypeEnum);

export const financialGroups = pgTable(
  "financialGroups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: financialGroupTypePGEnum("type").notNull(),
    description: text("description"),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    deleted: boolean("deleted").default(false),
    createdByName: text("created_by_name"),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { mode : "date",  withTimezone: true }).defaultNow(),
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
  ],
);

