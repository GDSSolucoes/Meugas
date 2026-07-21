import {
  pgTable,
  boolean,
  date,
  numeric,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";
import { vehicles } from "./vehicle.schema";

export const fuelings = pgTable(
  "fuelings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "restrict" }),
    vehiclePlate: text("vehicle_plate"),
    vehicleDescription: text("vehicle_description"),
    fleetNumber: text("fleet_number"),
    driverId: uuid("driver_id"),
    driverName: text("driver_name"),
    fuelingDate: date("fueling_date", { mode: "date" }).notNull(),
    currentKm: numeric("current_km", { mode: "number" }).notNull(),
    liters: numeric("liters", { mode: "number" }).notNull(),
    totalValue: numeric("total_value", { mode: "number" }).notNull(),
    pricePerLiter: numeric("price_per_liter", { mode: "number" }),
    kmTraveled: numeric("km_traveled", { mode: "number" }),
    consumption: numeric("consumption", { mode: "number" }),
    costPerKm: numeric("cost_per_km", { mode: "number" }),
    createExpense: boolean("create_expense").default(false),
    cashMovementId: uuid("cash_movement_id"),
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
    pgPolicy("fuelings_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("fuelings_company_id_index").on(table.companyId),
  ],
);
