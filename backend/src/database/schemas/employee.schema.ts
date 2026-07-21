import {
  pgTable,
  boolean,
  date,
  numeric,
  text,
  timestamp,
  uuid,
  pgEnum,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";

export enum EmployeePositionEnum {
  VENDEDOR = "vendedor",
  ENTREGADOR = "entregador",
  GERENTE = "gerente",
  ADMINISTRATIVO = "administrativo",
  OUTRO = "outro",
}

export const EmployeePositionPGEnum = pgEnum(
  "employee_position",
  EmployeePositionEnum,
);

export const employees = pgTable(
  "employees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    document: text("document"),
    email: text("email"),
    phone: text("phone"),
    position: EmployeePositionPGEnum("position").notNull(),
    salary: numeric("salary", { mode: "number" }),
    hireDate: date("hire_date", { mode: "date" }),
    vacationStart: date("vacation_start", { mode: "date" }),
    vacationEnd: date("vacation_end", { mode: "date" }),
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
    pgPolicy("employees_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("employees_company_id_index").on(table.companyId),
    index("employees_position_index").on(table.position),
  ],
);
