import { pgTable, uuid, text, timestamp, boolean, integer, json, date, numeric, pgEnum } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'

export type PersonAddress = {
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  reference_point?: string
  city?: string
  state?: string
  zipcode?: string
}

export const peopleType = pgEnum('people_type', ['cliente', 'fornecedor', 'ponto_venda', 'conveniada'])

export const people = pgTable('people', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  personNumber: text('person_number'),
  name: text('name').notNull(),
  document: text('document'),
  email: text('email'),
  phone: json('phone').$type<string[]>(),
  type: peopleType('type').notNull(),
  address: json('address').$type<PersonAddress>(),
  glpConsumptionDays: numeric('glp_consumption_days'),
  birthday: date('birthday'),
  conveniadaId: text('conveniada_id'),
  conveniadaName: text('conveniada_name'),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})
