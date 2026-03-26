import {
  pgTable,
  boolean,
  text,
  timestamp,
  uuid,
  index,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";
import { employees } from "./employee.schema";
import { sectorMasters } from "./sectorMaster.schema";

export const sectors = pgTable(
  "sectors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    employeeId: uuid("employee_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    employeeName: text("employee_name"),
    phone: text("phone"),
    isOwnStock: boolean("is_own_stock").default(true),
    masterSectorId: uuid("master_sector_id").references(() => sectorMasters.id, {
      onDelete: "set null",
    }),
    masterSectorName: text("master_sector_name"),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    deleted: boolean("deleted").default(false),
    createdByName: text("created_by_name"),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("sectors_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("sectors_company_id_index").on(table.companyId),
  ],
);

