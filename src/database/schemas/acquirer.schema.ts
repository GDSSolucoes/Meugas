import {
  pgTable,
  boolean,
  numeric,
  text,
  timestamp,
  uuid,
  index,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";

export const acquirers = pgTable(
  "acquirers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    feePercentage: numeric("fee_percentage", { mode : "number"}).default(0),
    settlementDays: numeric("settlement_days", { mode : "number"}).default(1),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    active: boolean("active").default(true),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", { mode : "date",  withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("acquirers_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("acquirers_company_id_index").on(table.companyId),
  ],
);

