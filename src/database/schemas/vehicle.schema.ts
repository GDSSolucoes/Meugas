import {
  pgTable,
  boolean,
  integer,
  numeric,
  text,
  timestamp,
  uuid,
  pgEnum,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm";

export enum VehicleTypeEnum {
  CARRO = "carro",
  MOTO = "moto",
  CAMINHAO = "caminhao",
  VAN = "van",
  UTILITARIO = "utilitario",
  OUTRO = "outro",
}

export const vehicleTypePGEnum = pgEnum("vehicle_type", VehicleTypeEnum);

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    plate: text("plate").notNull(),
    fleetNumber: text("fleet_number"),
    type: vehicleTypePGEnum("type").notNull(),
    description: text("description").notNull(),
    year: numeric("year"),
    color: text("color"),
    initialKm: numeric("initial_km").default("0"),
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
    pgPolicy("vehicles_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("vehicles_company_id_index").on(table.companyId),
  ],
);

