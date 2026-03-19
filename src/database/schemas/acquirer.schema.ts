import { pgTable, boolean, integer, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'


export const acquirers = pgTable('acquirers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  feePercentage: numeric('fee_percentage').default('0'),
  settlementDays: numeric('settlement_days').default('1'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
