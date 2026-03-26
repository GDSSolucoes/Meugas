import {
  pgTable,
  integer,
  numeric,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
  boolean
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { products } from "./product.schema";
import { sectors } from "./sector.schema";
import { sql } from "drizzle-orm/sql/sql";

export const stockTransfers = pgTable(
  "stockTransfers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    productName: text("product_name"),
    fromSectorId: uuid("from_sector_id")
      .notNull()
      .references(() => sectors.id, { onDelete: "cascade" }),
    fromSectorName: text("from_sector_name"),
    toSectorId: uuid("to_sector_id")
      .notNull()
      .references(() => sectors.id, { onDelete: "cascade" }),
    toSectorName: text("to_sector_name"),
    quantity: numeric("quantity").notNull(),
    transferDate: timestamp("transfer_date", { withTimezone: true }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    deleted: boolean("deleted").default(false),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("stockTransfers_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("stockTransfers_company_id_index").on(table.companyId),
  ],
);

