import {
  pgTable,
  boolean,
  date,
  numeric,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";

export enum CashAccountTypeEnum {
  CAIXA_FISICO = 'caixa_fisico',
  CONTA_BANCARIA = 'conta_bancaria',
}

export const CashAccountTypePGEnum = pgEnum("cash_account_type", CashAccountTypeEnum);

export const cashAccounts = pgTable(
  "cashAccounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: CashAccountTypePGEnum("type").notNull(),
    balance: numeric("balance").default("0"),
    initialBalance: numeric("initial_balance").default("0"),
    initialBalanceDate: date("initial_balance_date"),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    createdByName: text("created_by_name"),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("cashAccounts_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("cashAccounts_company_id_index").on(table.companyId),
    index("cashAccounts_type_index").on(table.type),
  ],
);
