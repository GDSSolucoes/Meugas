import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'

export const roleEnum = pgEnum('user_role', ['user', 'admin'])
export const userTypeEnum = pgEnum('user_type', ['atendende', 'admin', 'super_admin'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull(),
  email: text('email').unique().notNull(),
  cpf: text('cpf').unique(),
  user_type: userTypeEnum('user_type').notNull(),
  phone: text('phone'),
  department: text('department'),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  active: boolean('active').default(true),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})
