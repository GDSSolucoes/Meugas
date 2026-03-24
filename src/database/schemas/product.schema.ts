import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  pgEnum,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";

export enum ProductCategoriesEnum {
  EQUIPAMENTO = "equipamento",
  ACESSORIO = "acessorio",
  GLP = "glp",
  AGUA = "agua",
  VASILHAME = "vasilhame",
  OUTROS = "outros",
}

export const productCategoriesPGEnum = pgEnum("product_categories", ProductCategoriesEnum);

export enum IcmsOrigemEnum {
  ORIGEM_0 = "0",
  ORIGEM_1 = "1",
  ORIGEM_2 = "2",
  ORIGEM_3 = "3",
  ORIGEM_4 = "4",
  ORIGEM_5 = "5",
  ORIGEM_6 = "6",
  ORIGEM_7 = "7",
  ORIGEM_8 = "8",
}

export const icmsOrigemPGEnum = pgEnum("icms_origem", IcmsOrigemEnum);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code"),
  category: productCategoriesPGEnum("category"),
  unitPrice: numeric("unit_price").notNull(),
  costPrice: numeric("cost_price").default("0"),
  minStock: integer("min_stock").default(10),
  vasilhameId: text("vasilhame_id"),
  vasilhameName: text("vasilhame_name"),
  ncm: text("ncm"),
  cest: text("cest"),
  unidadeTributavel: text("unidade_tributavel").default("UN"),
  icmsOrigem: icmsOrigemPGEnum("icms_origem").default(IcmsOrigemEnum.ORIGEM_0),
  beneficioFiscal: text("beneficio_fiscal"),
  anpCodigo: text("anp_codigo"),
  anpDescricao: text("anp_descricao"),
  valorSemIcmsKg: numeric("valor_sem_icms_kg").default("0"),
  kgPorUnidadeGlp: numeric("kg_por_unidade_glp").default("0"),
  percentualGlp: numeric("percentual_glp").default("0"),
  percentualGnNacional: numeric("percentual_gn_nacional").default("0"),
  percentualGnImportado: numeric("percentual_gn_importado").default("0"),
  codif: text("codif"),
  pesoLiquido: numeric("peso_liquido").default("0"),
  pesoBruto: numeric("peso_bruto").default("0"),
  informacoesAdicionaisNfe: text("informacoes_adicionais_nfe"),
  companyName: text("company_name"),
  createdByName: text("created_by_name"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
},
  (table) => [
    pgPolicy("products_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
    index("products_company_id_index").on(table.companyId),
    index("products_category_index").on(table.category),
  ],
);
