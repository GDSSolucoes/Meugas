import { pgTable, date, integer, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'



export const contasapagars = pgTable('contasapagars', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id'),
  supplierName: text('supplier_name'),
  description: text('description').notNull(),
  dueDate: date('due_date').notNull(),
  amount: numeric('amount').notNull(),
  status: text('status').default("aberto"),
  paymentDate: date('payment_date'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
