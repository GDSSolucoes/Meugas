import {
  pgTable,
  numeric,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql/sql";
import { companies } from "./company.schema";
import { orders } from "./order.schema";
import { products } from "./product.schema";

export const orderItems = pgTable(
  "orderItems",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "restrict",
    }),
    productName: text("product_name"),
    quantity: numeric("quantity", { mode: "number" }),
    unitPrice: numeric("unit_price", { mode: "number" }),
    discount: numeric("discount", { mode: "number" }),
    total: numeric("total", { mode: "number" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    companyName: text("company_name"),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => [
    pgPolicy("orderItems_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("orderItems_order_id_index").on(table.orderId),
    index("orderItems_product_id_index").on(table.productId),
    index("orderItems_company_id_index").on(table.companyId),
  ],
);
