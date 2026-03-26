import {
  pgTable,
  boolean,
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

export enum PaymentTypesTypeEnum {
  DINHEIRO = "dinheiro",
  PIX = "pix",
  CARTAO_DEBITO = "cartao_debito",
  CARTAO_CREDITO = "cartao_credito",
  BOLETO = "boleto",
  CHEQUE = "cheque",
  CONVENIO = "convenio",
}

export const paymentTypesTypePGEnum = pgEnum("payment_types_type_enum", PaymentTypesTypeEnum);

export const paymentTypes = pgTable("paymentTypes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: paymentTypesTypePGEnum("type").notNull(),
  maxInstallments: numeric("max_installments").default("1"),
  daysInterval: numeric("days_interval").default("30"),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  companyName: text("company_name"),
    deleted: boolean("deleted").default(false),
    createdByName: text("created_by_name"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
},
  (table) => [
    pgPolicy("paymentTypes_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("paymentTypes_company_id_index").on(table.companyId),
    index("paymentTypes_type_index").on(table.type),
  ],);

