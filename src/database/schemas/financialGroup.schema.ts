import { pgTable, boolean, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'



export const financialgroups = pgTable('financialgroups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  description: text('description'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
