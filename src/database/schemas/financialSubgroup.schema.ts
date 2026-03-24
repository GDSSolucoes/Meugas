import {
  pgTable,
  boolean,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";
import { financialGroups } from "./financialGroup.schema";

export const financialSubgroups = pgTable(
  "financialSubgroups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    financialGroupId: uuid("financial_group_id")
      .notNull()
      .references(() => financialGroups.id, { onDelete: "cascade" }),
    financialGroupName: text("financial_group_name"),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    createdByName: text("created_by_name"),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("financialSubgroups_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("financialSubgroups_company_id_index").on(table.companyId),
    index("financialSubgroups_financial_group_id_index").on(
      table.financialGroupId,
    ),
  ],
);
