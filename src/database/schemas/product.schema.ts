import { pgTable, uuid, text, timestamp, boolean, numeric, integer } from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: integer('company_id').notNull(),
  name: text('name').notNull(),
  code: text('code'),
  category: text('category'),
  unitPrice: numeric('unit_price'),
  costPrice: numeric('cost_price'),
  minStock: integer('min_stock'),
  vasilhameId: text('vasilhame_id'),
  vasilhameName: text('vasilhame_name'),
  ncm: text('ncm'),
  cest: text('cest'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})
