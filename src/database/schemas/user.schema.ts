import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  cpf: text('cpf'),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  companyId: integer('company_id').notNull(),
  role: text('role').notNull(),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})
