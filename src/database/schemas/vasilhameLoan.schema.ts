import { pgTable, date, integer, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'



export const vasilhameloans = pgTable('vasilhameloans', {
  id: uuid('id').primaryKey().defaultRandom(),
  saleId: uuid('sale_id').notNull(),
  personId: uuid('person_id').notNull(),
  personName: text('person_name'),
  vasilhameId: uuid('vasilhame_id').notNull(),
  vasilhameName: text('vasilhame_name'),
  loanQuantity: numeric('loan_quantity').notNull(),
  returnedQuantity: numeric('returned_quantity').default('0'),
  loanDate: date('loan_date'),
  status: text('status').default("pendente"),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
