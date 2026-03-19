import { pgTable, date, integer, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'


export const productstocks = pgTable('productstocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull(),
  productName: text('product_name'),
  sectorId: uuid('sector_id').notNull(),
  sectorName: text('sector_name'),
  quantity: numeric('quantity').notNull(),
  initialDate: date('initial_date'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
