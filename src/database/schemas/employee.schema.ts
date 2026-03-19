import { pgTable, boolean, date, integer, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'



export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  document: text('document'),
  email: text('email'),
  phone: text('phone'),
  position: text('position').notNull(),
  salary: numeric('salary'),
  hireDate: date('hire_date'),
  vacationStart: date('vacation_start'),
  vacationEnd: date('vacation_end'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
