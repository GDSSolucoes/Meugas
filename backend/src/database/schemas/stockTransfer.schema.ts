import {
  pgTable,
  numeric,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { products } from "./product.schema";
import { sectors } from "./sector.schema";
import { sql } from "drizzle-orm/sql/sql";

export const stockTransfers = pgTable(
  "stockTransfers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transferNumber: text("transfer_number"),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productName: text("product_name"),
    fromSectorId: uuid("from_sector_id")
      .notNull()
      .references(() => sectors.id, { onDelete: "restrict" }),
    fromSectorName: text("from_sector_name"),
    toSectorId: uuid("to_sector_id")
      .notNull()
      .references(() => sectors.id, { onDelete: "restrict" }),
    toSectorName: text("to_sector_name"),
    quantity: numeric("quantity", { mode: "number" }).notNull(),
    transferDate: timestamp("transfer_date", {
      mode: "date",
      withTimezone: true,
    }),
    notes: text("notes"),
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
