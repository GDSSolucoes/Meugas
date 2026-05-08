import {
  pgTable,
  date,
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
import { persons } from "./person.schema";
import { cashAccounts } from "./cashAccount.schema";
import { paymentTypes } from "./paymentType.schema";

export enum CashMovementTypeEnum {
  RECEITA = "receita",
  DESPESA = "despesa",
}

export const CashMovementTypePGEnum = pgEnum("cash_movement_type", CashMovementTypeEnum);

export const cashMovements = pgTable(
  "cashMovements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cashAccountId: uuid("cash_account_id").notNull().references(() => cashAccounts.id, {
      onDelete: "cascade",
    }),
    cashAccountName: text("cash_account_name"),
    type: CashMovementTypePGEnum("type").notNull(),
    amount: numeric("amount", { mode : "number"}).notNull(),
    description: text("description").notNull(),
    movementDate: date("movement_date", { mode : "date"}),
    personId: uuid("person_id").references(() => persons.id, {
      onDelete: "set null",
    }),
    personName: text("person_name"),
    groupId: uuid("group_id"),
    groupName: text("group_name"),
    subgroupId: uuid("subgroup_id"),
    subgroupName: text("subgroup_name"),
    documentNumber: text("document_number"),
    competenceMonth: text("competence_month"),
    paymentTypeId: uuid("payment_type_id").references(() => paymentTypes.id, {
      onDelete: "set null",
    }),
    paymentTypeName: text("payment_type_name"),
    notes: text("notes"),
    isAccounting: boolean("is_accounting").default(false),
    relatedDocId: uuid("related_doc_id"),
    sectorId: uuid("sector_id"),
    sectorName: text("sector_name"),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    active: boolean("active").default(true),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", { mode : "date",  withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("cashMovements_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("cashMovements_company_id_index").on(table.companyId),
    index("cashMovements_type_index").on(table.type),
    index("cashMovements_cash_account_id_index").on(table.cashAccountId),
    index("cashMovements_person_id_index").on(table.personId),
    index("cashMovements_group_id_index").on(table.groupId),
  ],
);

