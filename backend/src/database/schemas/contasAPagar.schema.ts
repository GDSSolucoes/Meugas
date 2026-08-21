import {
  pgTable,
  numeric,
  text,
  timestamp,
  uuid,
  pgEnum,
  pgPolicy,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { dateOnly } from "./date-only";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";
import { paymentTypes } from "./paymentType.schema";
import { purchases } from "./purchase.schema";

export enum ContasAPagarStatusEnum {
  ABERTO = "aberto",
  PAGO = "pago",
  VENCIDO = "vencido",
}

export const contasAPagarStatusPGEnum = pgEnum(
  "contas_a_pagar_status",
  ContasAPagarStatusEnum,
);

export const contasAPagar = pgTable(
  "contasAPagar",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supplierId: uuid("supplier_id"),
    supplierName: text("supplier_name"),
    description: text("description").notNull(),
    dueDate: dateOnly("due_date").notNull(),
    amount: numeric("amount", { mode: "number" }).notNull(),
    installmentNumber: numeric("installment_number", { mode: "number" }),
    status: contasAPagarStatusPGEnum("status").default(
      ContasAPagarStatusEnum.ABERTO,
    ),
    paymentTypeId: uuid("payment_type_id").references(() => paymentTypes.id, {
      onDelete: "restrict",
    }),
    paymentTypeName: text("payment_type_name"),
    paymentDate: dateOnly("payment_date"),
    purchaseId: uuid("purchase_id").references(() => purchases.id, {
      onDelete: "restrict",
    }),
    nfeNumber: text("nfe_number"),
    groupId: uuid("group_id"),
    groupName: text("group_name"),
    subgroupId: uuid("subgroup_id"),
    subgroupName: text("subgroup_name"),
    documentNumber: text("document_number"),
    reagendamentoMotivo: text("reagendamento_motivo"),
    reagendamentoData: dateOnly("reagendamento_data"),
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
