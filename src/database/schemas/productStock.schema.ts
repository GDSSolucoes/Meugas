import {
  pgTable,
  date,
  numeric,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";
import { products } from "./product.schema";
import { sectors } from "./sector.schema";

export const productStocks = pgTable(
  "productStocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    productName: text("product_name"),
    sectorId: uuid("sector_id").notNull().references(() => sectors.id, { onDelete: "cascade" }),
    sectorName: text("sector_name"),
    quantity: numeric("quantity").notNull(),
    initialDate: date("initial_date"),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    deleted: boolean("deleted").default(false),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("productStocks_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("productStocks_company_id_index").on(table.companyId),
    index("productStocks_product_id_index").on(table.productId),
    index("productStocks_sector_id_index").on(table.sectorId),
  ],
);

