import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  json,
  date,
  numeric,
  pgEnum,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";

export type PersonAddress = {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  reference_point?: string;
  city?: string;
  state?: string;
  zipcode?: string;
};

export enum PersonTypeEnum {
  CLIENTE = "cliente",
  FORNECEDOR = "fornecedor",
  PONTO_VENDA = "ponto_venda",
  CONVENIADA = "conveniada",
}

export const personTypePGEnum = pgEnum("person_type", PersonTypeEnum);

export const persons = pgTable(
  "persons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    personNumber: text("person_number"),
    name: text("name").notNull(),
    document: text("document"),
    email: text("email"),
    phone: json("phone").$type<string[]>(),
    type: personTypePGEnum("type").notNull(),
    address: json("address").$type<PersonAddress>(),
    glpConsumptionDays: numeric("glp_consumption_days"),
    birthday: date("birthday"),
    conveniadaId: text("conveniada_id"),
    conveniadaName: text("conveniada_name"),
    companyName: text("company_name"),
    deleted: boolean("deleted").default(false),
    createdByName: text("created_by_name"),
    active: boolean("active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("persons_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("persons_company_id_index").on(table.companyId),
    index("persons_type_index").on(table.type),
  ],
);

