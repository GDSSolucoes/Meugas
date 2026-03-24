import {
  pgTable,
  date,
  numeric,
  text,
  timestamp,
  uuid,
  pgEnum,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";

export enum ContasAPagarStatusEnum {
  ABERTO = "aberto",
  PAGO = "pago",
  VENCIDO = "vencido",
}

export const contasAPagarStatusPGEnum = pgEnum("contas_a_pagar_status", ContasAPagarStatusEnum);

export const contasAPagar = pgTable(
  "contasAPagar",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supplierId: uuid("supplier_id"),
    supplierName: text("supplier_name"),
    description: text("description").notNull(),
    dueDate: date("due_date").notNull(),
    amount: numeric("amount").notNull(),
    status: contasAPagarStatusPGEnum("status").default(ContasAPagarStatusEnum.ABERTO),
    paymentDate: date("payment_date"),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("contasAPagar_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("contasAPagar_company_id_index").on(table.companyId),
    index("contasAPagar_status_index").on(table.status),
  ],
);
