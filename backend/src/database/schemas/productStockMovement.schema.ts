import {
  pgTable,
  numeric,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";
import { products } from "./product.schema";
import { sectors } from "./sector.schema";
import { sales } from "./sale.schema";
import { purchases } from "./purchase.schema";
import { stockTransfers } from "./stockTransfer.schema";
import { productPickups } from "./productPickup.schema";
import { vasilhameLoans } from "./vasilhameLoan.schema";

// Tipos de movimentação de estoque
export enum StockMovementTypeEnum {
  Sale = "sale",
  Purchase = "purchase",
  Transfer = "transfer",
  Pickup = "pickup",
  Loan = "loan",
}

export const StockMovementTypePGEnum = pgEnum(
  "stock_movement_type",
  StockMovementTypeEnum,
);

// Schema de histórico de movimentações de estoque
export const productStockMovements = pgTable(
  "productStockMovements",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Produto e setor
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    productName: text("product_name"),
    sectorId: uuid("sector_id")
      .notNull()
      .references(() => sectors.id, { onDelete: "restrict" }),
    sectorName: text("sector_name"),

    // Tipo da movimentação
    type: StockMovementTypePGEnum("type").notNull(),

    // Relacionamento com a fonte da movimentação
    saleId: uuid("sale_id").references(() => sales.id, {
      onDelete: "restrict",
    }),
    purchaseId: uuid("purchase_id").references(() => purchases.id, {
      onDelete: "restrict",
    }),
    stockTransferId: uuid("stock_transfer_id").references(
      () => stockTransfers.id,
      {
        onDelete: "restrict",
      },
    ),
    productPickupId: uuid("product_pickup_id").references(
      () => productPickups.id,
      {
        onDelete: "restrict",
      },
    ),
    vasilhameLoanId: uuid("vasilhame_loan_id").references(
      () => vasilhameLoans.id,
      {
        onDelete: "restrict",
      },
    ),

    // Quantidade (positivo para entrada, negativo para saída)
    quantity: numeric("quantity", { mode: "number" }).notNull(),

    // Saldo anterior e novo saldo (para auditoria)
    previousBalance: numeric("previous_balance", { mode: "number" }),
    newBalance: numeric("new_balance", { mode: "number" }),

    // Data da movimentação
    movementDate: timestamp("movement_date", {
      mode: "date",
      withTimezone: true,
    }).notNull(),

    // Dados da empresa
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    companyName: text("company_name"),

    active: boolean("active").default(true),

    // Dados de auditoria
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
  },
  (table) => [
    pgPolicy("productStockMovements_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("productStockMovements_company_id_index").on(table.companyId),
    index("productStockMovements_product_id_index").on(table.productId),
    index("productStockMovements_sector_id_index").on(table.sectorId),
    index("productStockMovements_movement_date_index").on(table.movementDate),
    index("productStockMovements_type_index").on(table.type),
  ],
);
