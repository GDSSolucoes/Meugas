import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core'

export const people = pgTable('people', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: integer('company_id').notNull(),
  name: text('name').notNull(),
  document: text('document'),
  street: text('street'),
  number: text('number'),
  neighborhood: text('neighborhood'),
  city: text('city'),
  state: text('state'),
  zipcode: text('zipcode'),
  phone: text('phone'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})
