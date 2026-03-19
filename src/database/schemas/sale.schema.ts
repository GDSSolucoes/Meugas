import { pgTable, boolean, date, integer, json, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'



export type SaleItemsItem = {
  productId?: string
  productCode?: string
  productName?: string
  category?: string
  vasilhameId?: string
  vasilhameName?: string
  quantity?: number
  unitPrice?: number
  discount?: number
  total?: number
  quantityToPickup?: number
  vasilhameLoanQuantity?: number
}
export type SalePaymentMethodsItem = {
  paymentTypeId?: string
  paymentTypeName?: string
  amount?: number
  installments?: number
  cashAccountId?: string
  installmentsDetails?: any[]
}

export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleNumber: text('sale_number').notNull(),
  personId: uuid('person_id').notNull(),
  personName: text('person_name'),
  sectorId: uuid('sector_id'),
  sectorName: text('sector_name'),
  status: text('status').default("concluida"),
  saleDate: date('sale_date'),
  items: json('items').$type<SaleItemsItem[]>(),
  paymentMethods: json('payment_methods').$type<SalePaymentMethodsItem[]>(),
  totalAmount: numeric('total_amount').notNull(),
  notes: text('notes'),
  orderId: uuid('order_id'),
  orderNumber: text('order_number'),
  conveniadaId: uuid('conveniada_id'),
  conveniadaName: text('conveniada_name'),
  nfeNumber: text('nfe_number'),
  nfeKey: text('nfe_key'),
  nfeDate: timestamp('nfe_date', { withTimezone: true }),
  nfeCancelada: boolean('nfe_cancelada').default(false),
  nfeDataCancelamento: timestamp('nfe_data_cancelamento', { withTimezone: true }),
  nfeJustificativaCancelamento: text('nfe_justificativa_cancelamento'),
  nfceNumber: text('nfce_number'),
  nfceKey: text('nfce_key'),
  nfceDate: timestamp('nfce_date', { withTimezone: true }),
  nfceCancelada: boolean('nfce_cancelada').default(false),
  nfceDataCancelamento: timestamp('nfce_data_cancelamento', { withTimezone: true }),
  nfceJustificativaCancelamento: text('nfce_justificativa_cancelamento'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
