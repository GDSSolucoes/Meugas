import { pgTable, date, integer, json, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'


export type PurchaseItemsItem = {
  productId?: string
  productName?: string
  quantity?: number
  unitPrice?: number
  total?: number
}

export const purchases = pgTable('purchases', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id').notNull(),
  supplierName: text('supplier_name'),
  invoiceNumber: text('invoice_number'),
  items: json('items').$type<PurchaseItemsItem[]>(),
  totalAmount: numeric('total_amount').notNull(),
  purchaseDate: date('purchase_date'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
