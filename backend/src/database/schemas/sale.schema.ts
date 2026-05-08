import {
  pgTable,
  boolean,
  date,
  json,
  numeric,
  text,
  timestamp,
  uuid,
  pgEnum,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { persons } from "./person.schema";
import { sectors } from "./sector.schema";
import { orders } from "./order.schema";
import { sql } from "drizzle-orm/sql/sql";

export type SaleItemsItem = {
  productId?: string;
  productCode?: string;
  productName?: string;
  category?: string;
  vasilhameId?: string;
  vasilhameName?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  total?: number;
  quantityToPickup?: number;
  vasilhameLoanQuantity?: number;
};
export type SalePaymentMethodsItem = {
  paymentTypeId?: string;
  paymentTypeName?: string;
  amount?: number;
  installments?: number;
  cashAccountId?: string;
  installmentsDetails?: any[];
};

export enum SaleStatusEnum {
  CONCLUIDA = "concluida",
  CANCELADA = "cancelada",
}

export const saleStatusPGEnum = pgEnum("sale_status", SaleStatusEnum);

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleNumber: text("sale_number").notNull(),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    personName: text("person_name"),
    sectorId: uuid("sector_id").references(() => sectors.id, {
      onDelete: "set null",
    }),
    sectorName: text("sector_name"),
    status: saleStatusPGEnum("status").default(SaleStatusEnum.CONCLUIDA),
    saleDate: date("sale_date", { mode : "date" }).notNull(),
    items: json("items").$type<SaleItemsItem[]>(),
    paymentMethods: json("payment_methods").$type<SalePaymentMethodsItem[]>(),
    totalAmount: numeric("total_amount", { mode : "number" }).notNull(),
    notes: text("notes"),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    orderNumber: text("order_number"),
    conveniadaId: uuid("conveniada_id"),
    conveniadaName: text("conveniada_name"),
    nfeNumber: text("nfe_number"),
    nfeKey: text("nfe_key"),
    nfeDate: timestamp("nfe_date", { mode : "date",  withTimezone: true }),
    nfeCancelada: boolean("nfe_cancelada").default(false),
    nfeDataCancelamento: timestamp("nfe_data_cancelamento", { mode : "date", 
      withTimezone: true,
    }),
    nfeJustificativaCancelamento: text("nfe_justificativa_cancelamento"),
    nfceNumber: text("nfce_number"),
    nfceKey: text("nfce_key"),
    nfceDate: timestamp("nfce_date", { mode : "date",  withTimezone: true }),
    nfceCancelada: boolean("nfce_cancelada").default(false),
    nfceDataCancelamento: timestamp("nfce_data_cancelamento", { mode : "date", 
      withTimezone: true,
    }),
    nfceJustificativaCancelamento: text("nfce_justificativa_cancelamento"),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    active: boolean("active").default(true),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", { mode : "date",  withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("productStocks_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("sales_company_id_index").on(table.companyId),
  ],
);

