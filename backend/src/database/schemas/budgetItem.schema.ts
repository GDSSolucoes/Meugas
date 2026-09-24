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
import { sql } from "drizzle-orm/sql/sql";
import { companies } from "./company.schema";
import { budgets } from "./budget.schema";
import { products } from "./product.schema";

export const budgetItems = pgTable(
  "budgetItems",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    quantity: numeric("quantity", { mode: "number" }).notNull(),
    unitPrice: numeric("unit_price", { mode: "number" }).notNull(),
    total: numeric("total", { mode: "number" }).notNull(),
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
    pgPolicy("budgetItems_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("budgetItems_budget_id_index").on(table.budgetId),
    index("budgetItems_product_id_index").on(table.productId),
    index("budgetItems_company_id_index").on(table.companyId),
  ],
);
