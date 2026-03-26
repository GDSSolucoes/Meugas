import {
  pgTable,
  json,
  numeric,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm";

export type BudgetCustomerData = {
  name?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};
export type BudgetItemsItem = {
  productId?: string;
  productCode?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
};

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    budgetNumber: text("budget_number").notNull(),
    customerData: json("customer_data").$type<BudgetCustomerData>(),
    items: json("items").$type<BudgetItemsItem[]>(),
    totalAmount: numeric("total_amount").default("0"),
    notes: text("notes"),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    deleted: boolean("deleted").default(false),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("budgets_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("budgets_company_id_index").on(table.companyId),
  ],
);

