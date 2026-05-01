import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  pgEnum,
  index,
  pgPolicy,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql";

export enum userRoleEnum {
  ADMIN = "admin",
  USER = "user",
}

export enum userTypeEnum {
  ATENDENTE = "atendente",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export const userRolePGEnum = pgEnum("user_role", userRoleEnum);
export const userTypePGEnum = pgEnum("user_type", userTypeEnum);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    role: userRolePGEnum("role").notNull(),
    email: text("email").unique().notNull(),
    cpf: text("cpf").unique(),
    userType: userTypePGEnum("user_type").notNull(),
    phone: text("phone"),
    department: text("department"),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name").default(""),
    deleted: boolean("deleted").default(false),
    active: boolean("active").default(true),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { mode : "date",  withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("users_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    pgPolicy("select user to login", {
      for: "select",
      as: "permissive",
      to: "public",
      using: sql`current_setting('app.current_company_id', true)::uuid = ''`,
    }),
    index("company_id_index").on(table.companyId),
    index("email_index").on(table.email),
    index("cpf_index").on(table.cpf),
  ],
);

