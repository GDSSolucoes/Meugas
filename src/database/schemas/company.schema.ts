import { bigserial, date, json, pgTable, text, timestamp, numeric } from 'drizzle-orm/pg-core'

export type CompanyAddress = {
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipcode?: string
  codigo_municipio?: string
}

export type CompanyParametrosFiscais = {
  cnpj?: string
  razao_social?: string
  inscricao_estadual?: string
  regime_tributario?: 'simples_nacional' | 'lucro_presumido' | 'lucro_real' | 'mei'
  ambiente_nfe?: 'homologacao' | 'producao'
  emitir_nfe?: boolean
  emitir_nfce?: boolean
  serie_nfe?: number
  serie_nfce?: number
  numero_inicial_nfe?: number
  numero_inicial_nfce?: number
  observacoes_nfe?: string
  observacoes_nfce?: string
}



export const companies = pgTable('companies', {
  id: bigserial({ mode: 'number' }).primaryKey(),
  name: text('name').notNull(),
  document: text('document').unique().notNull(),
  email: text('email').unique().notNull(),
  phone: text('phone'),
  address: json('address').$type<CompanyAddress>(),
  parametros_fiscais: json('parametros_fiscais').$type<CompanyParametrosFiscais>(),
  plan_type: text('plan_type').default('basic'),
  monthly_fee: numeric('monthly_fee'),
  due_date: date('due_date'),
  status: text('status').default('ativa'),
  suspension_reason: text('suspension_reason'),
  admin_name: text('admin_name').notNull(),
  admin_email: text('admin_email').notNull(),
  created_by_name: text('created_by_name'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})
