import { pgTable, date, integer, json, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'



export type OrderPersonAddress = {
  street?: string
  number?: string
  neighborhood?: string
  referencePoint?: string
  city?: string
  state?: string
  zipcode?: string
}
export type OrderItemsItem = {
  productId?: string
  productName?: string
  quantity?: number
  unitPrice?: number
  discount?: number
  total?: number
}

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').notNull(),
  personId: uuid('person_id').notNull(),
  personName: text('person_name'),
  personAddress: json('person_address').$type<OrderPersonAddress>(),
  employeeId: uuid('employee_id'),
  employeeName: text('employee_name'),
  paymentTypeId: uuid('payment_type_id'),
  paymentTypeName: text('payment_type_name'),
  cashAccountId: uuid('cash_account_id'),
  cashAccountName: text('cash_account_name'),
  status: text('status').default("pendente"),
  items: json('items').$type<OrderItemsItem[]>(),
  totalAmount: numeric('total_amount').default('0'),
  deliveryDate: date('delivery_date'),
  notes: text('notes'),
  attendedAt: timestamp('attended_at', { withTimezone: true }),
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancellationReason: text('cancellation_reason'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
