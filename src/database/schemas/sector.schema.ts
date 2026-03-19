import { pgTable, boolean, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'


export const sectors = pgTable('sectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  employeeId: uuid('employee_id'),
  employeeName: text('employee_name'),
  phone: text('phone'),
  isOwnStock: boolean('is_own_stock').default(true),
  masterSectorId: uuid('master_sector_id'),
  masterSectorName: text('master_sector_name'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
