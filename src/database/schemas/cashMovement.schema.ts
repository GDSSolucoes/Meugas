import { pgTable, date, integer, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'



export const cashmovements = pgTable('cashmovements', {
  id: uuid('id').primaryKey().defaultRandom(),
  cashAccountId: uuid('cash_account_id').notNull(),
  cashAccountName: text('cash_account_name'),
  type: text('type').notNull(),
  amount: numeric('amount').notNull(),
  description: text('description').notNull(),
  movementDate: date('movement_date'),
  personId: uuid('person_id'),
  personName: text('person_name'),
  groupId: uuid('group_id'),
  groupName: text('group_name'),
  relatedDocId: uuid('related_doc_id'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
