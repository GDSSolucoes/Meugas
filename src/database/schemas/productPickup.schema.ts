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
  boolean,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { persons } from "./person.schema";
import { products } from "./product.schema";
import { sql } from "drizzle-orm";
import { sales } from "./sale.schema";
import { sectors } from "./sector.schema";

export enum ProductPickupStatusEnum {
  PENDENTE = "pendente",
  RETIRADO_PARCIAL = "retirado_parcial",
  RETIRADO_TOTAL = "retirado_total",
}

export const productPickupStatusPGEnum = pgEnum("product_pickup_status", ProductPickupStatusEnum);

export const productPickups = pgTable(
  "productPickups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    personName: text("person_name"),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    productName: text("product_name"),
    pickupQuantity: numeric("pickup_quantity", { mode : "number"}).notNull(),
    collectedQuantity: numeric("collected_quantity", { mode : "number"}).default(0),
    collectedDate: date("collected_date", { mode : "date"}),
    saleDate: date("sale_date", { mode : "date"}),
    sectorId: uuid("sector_id").references(() => sectors.id, { onDelete: "set null" }),
    sectorName: text("sector_name"),
    notaFiscal: text("nota_fiscal"),
    pedido: text("pedido"),
    status: productPickupStatusPGEnum("status").default(ProductPickupStatusEnum.PENDENTE),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    active: boolean("active").default(true),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", { mode : "date",  withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("productPickups_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("productPickups_company_id_index").on(table.companyId),
    index("productPickups_status_index").on(table.status),
  ],
);

