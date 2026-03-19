import { pgTable, uuid, text, timestamp, boolean, numeric, integer } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'


export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  code: text('code'),
  category: text('category'),
  unitPrice: numeric('unit_price').notNull(),
  costPrice: numeric('cost_price').default('0'),
  minStock: integer('min_stock').default(10),
  vasilhameId: text('vasilhame_id'),
  vasilhameName: text('vasilhame_name'),
  ncm: text('ncm'),
  cest: text('cest'),
  unidadeTributavel: text('unidade_tributavel').default('UN'),
  icmsOrigem: text('icms_origem').default('0'),
  beneficioFiscal: text('beneficio_fiscal'),
  anpCodigo: text('anp_codigo'),
  anpDescricao: text('anp_descricao'),
  valorSemIcmsKg: numeric('valor_sem_icms_kg').default('0'),
  kgPorUnidadeGlp: numeric('kg_por_unidade_glp').default('0'),
  percentualGlp: numeric('percentual_glp').default('0'),
  percentualGnNacional: numeric('percentual_gn_nacional').default('0'),
  percentualGnImportado: numeric('percentual_gn_importado').default('0'),
  codif: text('codif'),
  pesoLiquido: numeric('peso_liquido').default('0'),
  pesoBruto: numeric('peso_bruto').default('0'),
  informacoesAdicionaisNfe: text('informacoes_adicionais_nfe'),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})
