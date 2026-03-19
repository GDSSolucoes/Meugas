import { pgTable, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'


export const sectormasters = pgTable('sectormasters', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
