import { pgTable, boolean, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'


export const financialsubgroups = pgTable('financialsubgroups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  financialGroupId: uuid('financial_group_id').notNull(),
  financialGroupName: text('financial_group_name'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
