import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  cnpj: text('cnpj'),
  state: text('state'),
  city: text('city'),
  street: text('street'),
  number: text('number'),
  neighborhood: text('neighborhood'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})
