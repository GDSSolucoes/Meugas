import {
  pgTable,
  date,
  json,
  numeric,
  text,
  timestamp,
  uuid,
  pgEnum,
  pgPolicy,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";
import { persons } from "./person.schema";
import { employees } from "./employee.schema";
import { paymentTypes } from "./paymentType.schema";
import { cashAccounts } from "./cashAccount.schema";

export type OrderPersonAddress = {
  street?: string;
  number?: string;
  neighborhood?: string;
  referencePoint?: string;
  city?: string;
  state?: string;
  zipcode?: string;
};
export type OrderItemsItem = {
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  total?: number;
};

export enum OrdersStatusEnum {
  PENDENTE = "pendente",
  EM_ATENDIMENTO = "em_atendimento",
  FINALIZADO = "finalizado",
  CANCELADO = "cancelado",
}

export const ordersStatusPGEnum = pgEnum("orders_status_enum", OrdersStatusEnum);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull(),
    personId: uuid("person_id").notNull().references(() => persons.id, { onDelete: "set null" }),
    personName: text("person_name"),
    personAddress: json("person_address").$type<OrderPersonAddress>(),
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "set null" }),
    employeeName: text("employee_name"),
    paymentTypeId: uuid("payment_type_id").references(() => paymentTypes.id, { onDelete: "set null" }),
    paymentTypeName: text("payment_type_name"),
    cashAccountId: uuid("cash_account_id").references(() => cashAccounts.id, { onDelete: "set null" }),
    cashAccountName: text("cash_account_name"),
    status: ordersStatusPGEnum("status").default(OrdersStatusEnum.PENDENTE),
    items: json("items").$type<OrderItemsItem[]>(),
    totalAmount: numeric("total_amount", { mode : "number"}).default(0),
    deliveryDate: date("delivery_date", { mode : "date"}),
    notes: text("notes"),
    attendedAt: timestamp("attended_at", { mode : "date",  withTimezone: true }),
    finalizedAt: timestamp("finalized_at", { mode : "date",  withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { mode : "date",  withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    deleted: boolean("deleted").default(false),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", { mode : "date",  withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("orders_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("orders_company_id_index").on(table.companyId),
    index("orders_status_index").on(table.status)
  ],
);

