import { pgTable, integer, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'


export const stocktransfers = pgTable('stocktransfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull(),
  productName: text('product_name'),
  fromSectorId: uuid('from_sector_id').notNull(),
  fromSectorName: text('from_sector_name'),
  toSectorId: uuid('to_sector_id').notNull(),
  toSectorName: text('to_sector_name'),
  quantity: numeric('quantity').notNull(),
  transferDate: timestamp('transfer_date', { withTimezone: true }),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
