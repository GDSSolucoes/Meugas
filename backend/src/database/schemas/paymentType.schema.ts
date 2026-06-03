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
import { acquirers } from "./acquirer.schema";
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

export const paymentTypesTypePGEnum = pgEnum(
  "payment_types_type_enum",
  PaymentTypesTypeEnum,
);

export const paymentTypes = pgTable(
  "paymentTypes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    type: paymentTypesTypePGEnum("type").notNull(),
    maxInstallments: numeric("max_installments", { mode: "number" }).default(1),
    daysInterval: numeric("days_interval", { mode: "number" }).default(30),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    acquirerId: uuid("acquirer_id").references(() => acquirers.id, {
      onDelete: "set null",
    }),
    active: boolean("active").default(true),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
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
    index("paymentTypes_acquirer_id_index").on(table.acquirerId),
  ],
);
