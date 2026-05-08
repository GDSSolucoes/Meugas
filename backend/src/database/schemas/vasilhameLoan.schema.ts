import {
  pgTable,
  date,
  numeric,
  text,
  timestamp,
  uuid,
  pgEnum,
  pgPolicy,
  index,
  boolean
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sales } from "./sale.schema";
import { persons } from ".";
import { sql } from "drizzle-orm/sql";

export enum VasilhameLoanStatusEnum {
  PENDENTE = "pendente",
  DEVOLVIDO_PARCIAL = "devolvido_parcial",
  DEVOLVIDO_TOTAL = "devolvido_total",
}

export const vasilhameLoanStatusPGEnum = pgEnum("vasilhame_loan_status", VasilhameLoanStatusEnum);

export const vasilhameLoans = pgTable(
  "vasilhameLoans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => persons.id, { onDelete: "cascade" }),
    personName: text("person_name"),
    vasilhameId: uuid("vasilhame_id").notNull(),
    vasilhameName: text("vasilhame_name"),
    loanQuantity: numeric("loan_quantity", { mode : "number"}).notNull(),
    returnedQuantity: numeric("returned_quantity", { mode : "number"}).default(0),
    loanDate: date("loan_date", { mode : "date"}),
    status: vasilhameLoanStatusPGEnum("status").default(VasilhameLoanStatusEnum.PENDENTE),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    active: boolean("active").default(true),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", { mode : "date",  withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("vasilhameLoans_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("vasilhameLoans_company_id_index").on(table.companyId),
  ],
);

