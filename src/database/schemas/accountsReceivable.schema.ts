import { pgTable, date, integer, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'



export const accountsreceivables = pgTable('accountsreceivables', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id').notNull(),
  personName: text('person_name'),
  saleId: uuid('sale_id'),
  installmentNumber: numeric('installment_number').default('1'),
  description: text('description').notNull(),
  dueDate: date('due_date').notNull(),
  amount: numeric('amount').notNull(),
  status: text('status').default("pendente"),
  paymentDate: date('payment_date'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
