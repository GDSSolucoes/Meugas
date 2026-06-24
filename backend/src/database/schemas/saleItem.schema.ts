import {
  pgTable,
  numeric,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";
import { sales } from "./sale.schema";
import { products } from "./product.schema";

export const saleItems = pgTable(
  "saleItems",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productCode: text("product_code"),
    productName: text("product_name"),
    category: text("category"),
    vasilhameId: uuid("vasilhame_id"),
    vasilhameName: text("vasilhame_name"),
    quantity: numeric("quantity", { mode: "number" }),
    unitPrice: numeric("unit_price", { mode: "number" }),
    discount: numeric("discount", { mode: "number" }),
    total: numeric("total", { mode: "number" }),
    quantityToPickup: numeric("quantity_to_pickup", { mode: "number" }),
    vasilhameLoanQuantity: numeric("vasilhame_loan_quantity", {
      mode: "number",
    }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => [
    pgPolicy("saleItems_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("saleItems_sale_id_index").on(table.saleId),
    index("saleItems_product_id_index").on(table.productId),
    index("saleItems_company_id_index").on(table.companyId),
  ],
);
