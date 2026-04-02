import {
  date,
  json,
  pgTable,
  text,
  timestamp,
  numeric,
  uuid,
  pgPolicy,
  index,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm/sql/sql";

export type CompanyAddress = {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  codigoMunicipio?: string;
};

export type CompanyParametrosFiscais = {
  cnpj?: string;
  razaoSocial?: string;
  inscricaoEstadual?: string;
  regimeTributario?:
    | "simplesNacional"
    | "lucroPresumido"
    | "lucroReal"
    | "mei";
  ambienteNfe?: "homologacao" | "producao";
  emitirNfe?: boolean;
  emitirNfce?: boolean;
  serieNfe?: number;
  serieNfce?: number;
  numeroInicialNfe?: number;
  numeroInicialNfce?: number;
  observacoesNfe?: string;
  observacoesNfce?: string;
};

export enum CompanyStatusEnum {
  ATIVA = "ativa",
  INATIVA = "inativa",
  SUSPENSA_PAGAMENTO = "suspensa_pagamento",
}

export enum PlanTypeEnum {
  BASIC = "basic",
  PREMIUM = "premium",
  ENTERPRISE = "enterprise",
}

export const CompanyStatusPGEnum = pgEnum("company_status", CompanyStatusEnum);
export const PlanTypePGEnum = pgEnum("plan_type", PlanTypeEnum);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    document: text("document").unique().notNull(),
    email: text("email").unique().notNull(),
    phone: text("phone"),
    address: json("address").$type<CompanyAddress>(),
    parametros_fiscais:
      json("parametros_fiscais").$type<CompanyParametrosFiscais>(),
    plan_type: PlanTypePGEnum("plan_type").default(PlanTypeEnum.BASIC),
    monthly_fee: numeric("monthly_fee"),
    due_date: date("due_date"),
    status: CompanyStatusPGEnum("status").default(CompanyStatusEnum.ATIVA),
    suspension_reason: text("suspension_reason"),
    admin_name: text("admin_name").notNull(),
    admin_email: text("admin_email").notNull(),
    deleted: boolean("deleted").default(false),
    created_by_name: text("created_by_name"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    pgPolicy("companies_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`true`,
    }),
    index("companies_status_index").on(table.status),
  ],
);

