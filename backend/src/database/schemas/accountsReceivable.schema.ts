import {
  pgTable,
  date,
  numeric,
  text,
  timestamp,
  uuid,
  index,
  pgEnum,
  pgPolicy,
  boolean,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sales } from "./sale.schema";
import { sql } from "drizzle-orm";
import { persons } from "./person.schema";

export enum AccountsReceivableStatusEnum {
  PENDENTE = "pendente",
  PAGO = "pago",
  VENCIDO = "vencido",
}

export const AccountsReceivableStatusPGEnum = pgEnum(
  "accounts_receivable_status",
  AccountsReceivableStatusEnum,
);

export const accountsReceivables = pgTable(
  "accountsReceivables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "set null" }),
    personName: text("person_name"),
    saleId: uuid("sale_id").references(() => sales.id, {
      onDelete: "set null",
    }),
    installmentNumber: numeric("installment_number", { mode : "number"}).default(1),
    description: text("description"),
    dueDate: date("due_date", {mode: "date"}).notNull(),
    amount: numeric("amount", {mode: "number"}).notNull(),
    status: AccountsReceivableStatusPGEnum("status")
      .notNull()
      .default(AccountsReceivableStatusEnum.PENDENTE),
    paymentDate: date("payment_date", { mode : "date"}),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    active: boolean("active").default(true),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", { mode : "date",  withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("accountsReceivables_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("accountsReceivables_company_id_index").on(table.companyId),
    index("accountsReceivables_sale_id_index").on(table.saleId),
    index("accountsReceivables_person_id_index").on(table.personId),
    index("accountsReceivables_status_index").on(table.status),
  ],
);
