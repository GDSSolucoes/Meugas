import {
  pgTable,
  boolean,
  text,
  timestamp,
  uuid,
  pgPolicy,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";

export enum FacilitadorModeloFiscalEnum {
  NFCE = "55",
  NFCeST = "65",
}

export const facilitadorModeloFiscalPGEnum = pgEnum("facilitador_modelo_fiscal", FacilitadorModeloFiscalEnum);

export enum FacilitadorTipoOperacaoEnum {
  VENDA = "venda",
  COMPRA = "compra",
  REMESSA = "remessa",
  RETORNO = "retorno",
  DEVOLUCAO = "devolucao",
  TRANSFERENCIA = "transferencia",
  OUTRAS = "outras",
}
export const facilitadorTipoOperacaoPGEnum = pgEnum("facilitador_tipo_operacao", FacilitadorTipoOperacaoEnum);

export enum FacilitadorRegimeTributarioEnum {
  SIMPLES_NACIONAL = "simples_nacional",
  LUCRO_PRESUMIDO = "lucro_presumido",
  LUCRO_REAL = "lucro_real",
  MEI = "mei",
}
export const facilitadorRegimeTributarioPGEnum = pgEnum("facilitador_regime_tributario", FacilitadorRegimeTributarioEnum);

export const facilitadores = pgTable(
  "facilitadores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empresaId: uuid("empresa_id"),
    nome: text("nome").notNull(),
    modeloFiscal: facilitadorModeloFiscalPGEnum("modelo_fiscal")
      .notNull()
      .default(FacilitadorModeloFiscalEnum.NFCE),
    tipoOperacao: facilitadorTipoOperacaoPGEnum("tipo_operacao").notNull(),
    cfop: text("cfop").notNull(),
    regimeTributario:
      facilitadorRegimeTributarioPGEnum("regime_tributario").notNull(),
    icmsSituacaoTributaria: text("icms_situacao_tributaria"),
    pisSituacaoTributaria: text("pis_situacao_tributaria"),
    cofinsSituacaoTributaria: text("cofins_situacao_tributaria"),
    ipiSituacaoTributaria: text("ipi_situacao_tributaria"),
    observacoes: text("observacoes"),
    ativo: boolean("ativo").default(true),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    deleted: boolean("deleted").default(false),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("facilitadores_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("facilitadores_company_id_index").on(table.companyId),
    index("facilitadores_tipo_operacao_index").on(table.tipoOperacao),
    index("facilitadores_modelo_fiscal_index").on(table.modeloFiscal),
    index("facilitadores_regime_tributario_index").on(table.regimeTributario),
    index("facilitadores_empresa_id_index").on(table.empresaId),
  ],
);

