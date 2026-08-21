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
import { dateOnly } from "./date-only";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm";
import { sectors } from "./sector.schema";

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    supplierId: uuid("supplier_id").notNull(),
    supplierName: text("supplier_name"),
    invoiceNumber: text("invoice_number"),
    totalAmount: numeric("total_amount", { mode: "number" }).notNull(),
    purchaseDate: dateOnly("purchase_date"),
    nfeNumber: text("nfe_number"),
    sectorId: uuid("sector_id").references(() => sectors.id, {
      onDelete: "restrict",
    }),
    sectorName: text("sector_name"),
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
    pgPolicy("purchases_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("purchases_company_id_index").on(table.companyId),
  ],
);
