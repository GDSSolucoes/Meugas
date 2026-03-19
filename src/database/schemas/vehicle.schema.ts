import { pgTable, boolean, integer, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'



export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  plate: text('plate').notNull(),
  fleetNumber: text('fleet_number'),
  type: text('type').notNull(),
  description: text('description').notNull(),
  year: numeric('year'),
  color: text('color'),
  initialKm: numeric('initial_km').default('0'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
