import { pgTable, boolean, integer, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './company.schema'



export const facilitadors = pgTable('facilitadors', {
  id: uuid('id').primaryKey().defaultRandom(),
  empresaId: uuid('empresa_id'),
  nome: text('nome').notNull(),
  modeloFiscal: text('modelo_fiscal').notNull().default("55"),
  tipoOperacao: text('tipo_operacao').notNull(),
  cfop: text('cfop').notNull(),
  regimeTributario: text('regime_tributario').notNull(),
  icmsSituacaoTributaria: text('icms_situacao_tributaria'),
  pisSituacaoTributaria: text('pis_situacao_tributaria'),
  cofinsSituacaoTributaria: text('cofins_situacao_tributaria'),
  ipiSituacaoTributaria: text('ipi_situacao_tributaria'),
  observacoes: text('observacoes'),
  ativo: boolean('ativo').default(true),
  companyId: integer('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  companyName: text('company_name'),
  createdByName: text('created_by_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
