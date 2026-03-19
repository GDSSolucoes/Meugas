import { pgTable, integer, json, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'


export type BudgetCustomerData = {
  name?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
}
export type BudgetItemsItem = {
  productId?: string
  productCode?: string
  productName?: string
  quantity?: number
  unitPrice?: number
  total?: number
}

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetNumber: text('budget_number').notNull(),
  customerData: json('customer_data').$type<BudgetCustomerData>(),
  items: json('items').$type<BudgetItemsItem[]>(),
  totalAmount: numeric('total_amount').default('0'),
  notes: text('notes'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
