import { pgTable, date, integer, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'



export const productpickups = pgTable('productpickups', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleId: uuid('sale_id').notNull(),
  personId: uuid('person_id').notNull(),
  personName: text('person_name'),
  productId: uuid('product_id').notNull(),
  productName: text('product_name'),
  pickupQuantity: numeric('pickup_quantity').notNull(),
  collectedQuantity: numeric('collected_quantity').default('0'),
  collectedDate: date('collected_date'),
  saleDate: date('sale_date'),
  sectorId: uuid('sector_id'),
  sectorName: text('sector_name'),
  notaFiscal: text('nota_fiscal'),
  pedido: text('pedido'),
  status: text('status').default("pendente"),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
