import { pgTable, boolean, date, integer, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'


export const fuelings = pgTable('fuelings', {
  id: uuid('id').primaryKey().defaultRandom(),
  vehicleId: uuid('vehicle_id').notNull(),
  vehiclePlate: text('vehicle_plate'),
  vehicleDescription: text('vehicle_description'),
  fleetNumber: text('fleet_number'),
  driverId: uuid('driver_id'),
  driverName: text('driver_name'),
  fuelingDate: date('fueling_date').notNull(),
  currentKm: numeric('current_km').notNull(),
  liters: numeric('liters').notNull(),
  totalValue: numeric('total_value').notNull(),
  pricePerLiter: numeric('price_per_liter'),
  kmTraveled: numeric('km_traveled'),
  consumption: numeric('consumption'),
  costPerKm: numeric('cost_per_km'),
  createExpense: boolean('create_expense').default(false),
  cashMovementId: uuid('cash_movement_id'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
