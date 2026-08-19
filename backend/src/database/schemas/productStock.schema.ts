import {
  pgTable,
  date,
  numeric,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
  uniqueIndex,
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
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productName: text("product_name"),
    sectorId: uuid("sector_id").references(() => sectors.id, {
      onDelete: "restrict",
    }),
    sectorName: text("sector_name"),
    // legacy sector master fields removed
    // Owner of the stock (which sector actually owns the stock)
    ownerSectorId: uuid("owner_sector_id").references(() => sectors.id, {
      onDelete: "restrict",
    }),
    quantity: numeric("quantity", { mode: "number" }).notNull(),
    initialDate: date("initial_date", { mode: "date" }),
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
    index("productStocks_owner_sector_id_index").on(table.ownerSectorId),
    uniqueIndex("productStocks_product_id_owner_sector_id_unique").on(
      table.productId,
      table.ownerSectorId,
    ),
  ],
);
