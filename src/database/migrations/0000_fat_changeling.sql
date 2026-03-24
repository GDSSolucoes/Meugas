CREATE TYPE "public"."accounts_receivable_status" AS ENUM('pendente', 'pago', 'vencido');--> statement-breakpoint
CREATE TYPE "public"."cash_account_type" AS ENUM('caixa_fisico', 'conta_bancaria');--> statement-breakpoint
CREATE TYPE "public"."cash_movement_type" AS ENUM('receita', 'despesa');--> statement-breakpoint
CREATE TYPE "public"."company_status" AS ENUM('ativa', 'inativa', 'suspensa_pagamento');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('basic', 'premium', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."contas_a_pagar_status" AS ENUM('aberto', 'pago', 'vencido');--> statement-breakpoint
CREATE TYPE "public"."employee_position" AS ENUM('vendedor', 'entregador', 'gerente', 'administrativo', 'outro');--> statement-breakpoint
CREATE TYPE "public"."facilitador_modelo_fiscal" AS ENUM('55', '65');--> statement-breakpoint
CREATE TYPE "public"."facilitador_regime_tributario" AS ENUM('simples_nacional', 'lucro_presumido', 'lucro_real', 'mei');--> statement-breakpoint
CREATE TYPE "public"."facilitador_tipo_operacao" AS ENUM('venda', 'compra', 'remessa', 'retorno', 'devolucao', 'transferencia', 'outras');--> statement-breakpoint
CREATE TYPE "public"."financial_group_type" AS ENUM('receita', 'despesa', 'movimentacao', 'investimento');--> statement-breakpoint
CREATE TYPE "public"."orders_status_enum" AS ENUM('pendente', 'em_atendimento', 'finalizado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."payment_types_type_enum" AS ENUM('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'boleto', 'cheque', 'convenio');--> statement-breakpoint
CREATE TYPE "public"."person_type" AS ENUM('cliente', 'fornecedor', 'ponto_venda', 'conveniada');--> statement-breakpoint
CREATE TYPE "public"."icms_origem" AS ENUM('0', '1', '2', '3', '4', '5', '6', '7', '8');--> statement-breakpoint
CREATE TYPE "public"."product_categories" AS ENUM('equipamento', 'acessorio', 'glp', 'agua', 'vasilhame', 'outros');--> statement-breakpoint
CREATE TYPE "public"."product_pickup_status" AS ENUM('pendente', 'retirado_parcial', 'retirado_total');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('concluida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('atendente', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."vasilhame_loan_status" AS ENUM('pendente', 'devolvido_parcial', 'devolvido_total');--> statement-breakpoint
CREATE TYPE "public"."vehicle_type" AS ENUM('carro', 'moto', 'caminhao', 'van', 'utilitario', 'outro');--> statement-breakpoint
CREATE TABLE "accountsReceivables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"person_name" text,
	"sale_id" uuid,
	"installment_number" numeric DEFAULT '1',
	"description" text NOT NULL,
	"due_date" date NOT NULL,
	"amount" numeric NOT NULL,
	"status" "accounts_receivable_status" DEFAULT 'pendente' NOT NULL,
	"payment_date" date,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accountsReceivables" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "acquirers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"fee_percentage" numeric DEFAULT '0',
	"settlement_days" numeric DEFAULT '1',
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "acquirers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_number" text NOT NULL,
	"customer_data" json,
	"items" json,
	"total_amount" numeric DEFAULT '0',
	"notes" text,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "budgets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "cashAccounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "cash_account_type" NOT NULL,
	"balance" numeric DEFAULT '0',
	"initial_balance" numeric DEFAULT '0',
	"initial_balance_date" date,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cashAccounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "cashMovements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cash_account_id" uuid NOT NULL,
	"cash_account_name" text,
	"type" "cash_movement_type" NOT NULL,
	"amount" numeric NOT NULL,
	"description" text NOT NULL,
	"movement_date" date,
	"person_id" uuid,
	"person_name" text,
	"group_id" uuid,
	"group_name" text,
	"related_doc_id" uuid,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cashMovements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"document" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" json,
	"parametros_fiscais" json,
	"plan_type" "plan_type" DEFAULT 'basic',
	"monthly_fee" numeric,
	"due_date" date,
	"status" "company_status" DEFAULT 'ativa',
	"suspension_reason" text,
	"admin_name" text NOT NULL,
	"admin_email" text NOT NULL,
	"created_by_name" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "companies_document_unique" UNIQUE("document"),
	CONSTRAINT "companies_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contasAPagar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid,
	"supplier_name" text,
	"description" text NOT NULL,
	"due_date" date NOT NULL,
	"amount" numeric NOT NULL,
	"status" "contas_a_pagar_status" DEFAULT 'aberto',
	"payment_date" date,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "contasAPagar" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"document" text,
	"email" text,
	"phone" text,
	"position" "employee_position" NOT NULL,
	"salary" numeric,
	"hire_date" date,
	"vacation_start" date,
	"vacation_end" date,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "facilitadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa_id" uuid,
	"nome" text NOT NULL,
	"modelo_fiscal" "facilitador_modelo_fiscal" DEFAULT '55' NOT NULL,
	"tipo_operacao" "facilitador_tipo_operacao" NOT NULL,
	"cfop" text NOT NULL,
	"regime_tributario" "facilitador_regime_tributario" NOT NULL,
	"icms_situacao_tributaria" text,
	"pis_situacao_tributaria" text,
	"cofins_situacao_tributaria" text,
	"ipi_situacao_tributaria" text,
	"observacoes" text,
	"ativo" boolean DEFAULT true,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "facilitadores" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "financialGroups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "financial_group_type" NOT NULL,
	"description" text,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "financialGroups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "financialSubgroups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"financial_group_id" uuid NOT NULL,
	"financial_group_name" text,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "financialSubgroups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fuelings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"vehicle_plate" text,
	"vehicle_description" text,
	"fleet_number" text,
	"driver_id" uuid,
	"driver_name" text,
	"fueling_date" date NOT NULL,
	"current_km" numeric NOT NULL,
	"liters" numeric NOT NULL,
	"total_value" numeric NOT NULL,
	"price_per_liter" numeric,
	"km_traveled" numeric,
	"consumption" numeric,
	"cost_per_km" numeric,
	"create_expense" boolean DEFAULT false,
	"cash_movement_id" uuid,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "fuelings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"person_id" uuid NOT NULL,
	"person_name" text,
	"person_address" json,
	"employee_id" uuid,
	"employee_name" text,
	"payment_type_id" uuid,
	"payment_type_name" text,
	"cash_account_id" uuid,
	"cash_account_name" text,
	"status" "orders_status_enum" DEFAULT 'pendente',
	"items" json,
	"total_amount" numeric DEFAULT '0',
	"delivery_date" date,
	"notes" text,
	"attended_at" timestamp with time zone,
	"finalized_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "paymentTypes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "payment_types_type_enum" NOT NULL,
	"max_installments" numeric DEFAULT '1',
	"days_interval" numeric DEFAULT '30',
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "paymentTypes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"person_number" text,
	"name" text NOT NULL,
	"document" text,
	"email" text,
	"phone" json,
	"type" "person_type" NOT NULL,
	"address" json,
	"glp_consumption_days" numeric,
	"birthday" date,
	"conveniada_id" text,
	"conveniada_name" text,
	"company_name" text,
	"created_by_name" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "persons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"category" "product_categories",
	"unit_price" numeric NOT NULL,
	"cost_price" numeric DEFAULT '0',
	"min_stock" integer DEFAULT 10,
	"vasilhame_id" text,
	"vasilhame_name" text,
	"ncm" text,
	"cest" text,
	"unidade_tributavel" text DEFAULT 'UN',
	"icms_origem" "icms_origem" DEFAULT '0',
	"beneficio_fiscal" text,
	"anp_codigo" text,
	"anp_descricao" text,
	"valor_sem_icms_kg" numeric DEFAULT '0',
	"kg_por_unidade_glp" numeric DEFAULT '0',
	"percentual_glp" numeric DEFAULT '0',
	"percentual_gn_nacional" numeric DEFAULT '0',
	"percentual_gn_importado" numeric DEFAULT '0',
	"codif" text,
	"peso_liquido" numeric DEFAULT '0',
	"peso_bruto" numeric DEFAULT '0',
	"informacoes_adicionais_nfe" text,
	"company_name" text,
	"created_by_name" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "productPickups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"person_name" text,
	"product_id" uuid NOT NULL,
	"product_name" text,
	"pickup_quantity" numeric NOT NULL,
	"collected_quantity" numeric DEFAULT '0',
	"collected_date" date,
	"sale_date" date,
	"sector_id" uuid,
	"sector_name" text,
	"nota_fiscal" text,
	"pedido" text,
	"status" "product_pickup_status" DEFAULT 'pendente',
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "productPickups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "productStocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" text,
	"sector_id" uuid NOT NULL,
	"sector_name" text,
	"quantity" numeric NOT NULL,
	"initial_date" date,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "productStocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" uuid NOT NULL,
	"supplier_name" text,
	"invoice_number" text,
	"items" json,
	"total_amount" numeric NOT NULL,
	"purchase_date" date,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "purchases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_number" text NOT NULL,
	"person_id" uuid NOT NULL,
	"person_name" text,
	"sector_id" uuid,
	"sector_name" text,
	"status" "sale_status" DEFAULT 'concluida',
	"sale_date" date,
	"items" json,
	"payment_methods" json,
	"total_amount" numeric NOT NULL,
	"notes" text,
	"order_id" uuid,
	"order_number" text,
	"conveniada_id" uuid,
	"conveniada_name" text,
	"nfe_number" text,
	"nfe_key" text,
	"nfe_date" timestamp with time zone,
	"nfe_cancelada" boolean DEFAULT false,
	"nfe_data_cancelamento" timestamp with time zone,
	"nfe_justificativa_cancelamento" text,
	"nfce_number" text,
	"nfce_key" text,
	"nfce_date" timestamp with time zone,
	"nfce_cancelada" boolean DEFAULT false,
	"nfce_data_cancelamento" timestamp with time zone,
	"nfce_justificativa_cancelamento" text,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sales" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"employee_id" uuid,
	"employee_name" text,
	"phone" text,
	"is_own_stock" boolean DEFAULT true,
	"master_sector_id" uuid,
	"master_sector_name" text,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sectors" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sectorMasters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sectorMasters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stockTransfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" text,
	"from_sector_id" uuid NOT NULL,
	"from_sector_name" text,
	"to_sector_id" uuid NOT NULL,
	"to_sector_name" text,
	"quantity" numeric NOT NULL,
	"transfer_date" timestamp with time zone,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "stockTransfers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"email" text NOT NULL,
	"cpf" text,
	"user_type" "user_type" NOT NULL,
	"phone" text,
	"department" text,
	"company_id" uuid NOT NULL,
	"active" boolean DEFAULT true,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vasilhameLoans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"person_name" text,
	"vasilhame_id" uuid NOT NULL,
	"vasilhame_name" text,
	"loan_quantity" numeric NOT NULL,
	"returned_quantity" numeric DEFAULT '0',
	"loan_date" date,
	"status" "vasilhame_loan_status" DEFAULT 'pendente',
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "vasilhameLoans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plate" text NOT NULL,
	"fleet_number" text,
	"type" "vehicle_type" NOT NULL,
	"description" text NOT NULL,
	"year" numeric,
	"color" text,
	"initial_km" numeric DEFAULT '0',
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "accountsReceivables" ADD CONSTRAINT "accountsReceivables_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accountsReceivables" ADD CONSTRAINT "accountsReceivables_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accountsReceivables" ADD CONSTRAINT "accountsReceivables_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquirers" ADD CONSTRAINT "acquirers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashAccounts" ADD CONSTRAINT "cashAccounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD CONSTRAINT "cashMovements_cash_account_id_cashAccounts_id_fk" FOREIGN KEY ("cash_account_id") REFERENCES "public"."cashAccounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD CONSTRAINT "cashMovements_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD CONSTRAINT "cashMovements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD CONSTRAINT "contasAPagar_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilitadores" ADD CONSTRAINT "facilitadores_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financialGroups" ADD CONSTRAINT "financialGroups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financialSubgroups" ADD CONSTRAINT "financialSubgroups_financial_group_id_financialGroups_id_fk" FOREIGN KEY ("financial_group_id") REFERENCES "public"."financialGroups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financialSubgroups" ADD CONSTRAINT "financialSubgroups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuelings" ADD CONSTRAINT "fuelings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuelings" ADD CONSTRAINT "fuelings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_type_id_paymentTypes_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."paymentTypes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cash_account_id_cashAccounts_id_fk" FOREIGN KEY ("cash_account_id") REFERENCES "public"."cashAccounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentTypes" ADD CONSTRAINT "paymentTypes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productPickups" ADD CONSTRAINT "productPickups_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productPickups" ADD CONSTRAINT "productPickups_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productPickups" ADD CONSTRAINT "productPickups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productPickups" ADD CONSTRAINT "productPickups_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productPickups" ADD CONSTRAINT "productPickups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStocks" ADD CONSTRAINT "productStocks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStocks" ADD CONSTRAINT "productStocks_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStocks" ADD CONSTRAINT "productStocks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_master_sector_id_sectorMasters_id_fk" FOREIGN KEY ("master_sector_id") REFERENCES "public"."sectorMasters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectorMasters" ADD CONSTRAINT "sectorMasters_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stockTransfers" ADD CONSTRAINT "stockTransfers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stockTransfers" ADD CONSTRAINT "stockTransfers_from_sector_id_sectors_id_fk" FOREIGN KEY ("from_sector_id") REFERENCES "public"."sectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stockTransfers" ADD CONSTRAINT "stockTransfers_to_sector_id_sectors_id_fk" FOREIGN KEY ("to_sector_id") REFERENCES "public"."sectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stockTransfers" ADD CONSTRAINT "stockTransfers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vasilhameLoans" ADD CONSTRAINT "vasilhameLoans_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vasilhameLoans" ADD CONSTRAINT "vasilhameLoans_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vasilhameLoans" ADD CONSTRAINT "vasilhameLoans_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accountsReceivables_company_id_index" ON "accountsReceivables" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "accountsReceivables_sale_id_index" ON "accountsReceivables" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "accountsReceivables_person_id_index" ON "accountsReceivables" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "accountsReceivables_status_index" ON "accountsReceivables" USING btree ("status");--> statement-breakpoint
CREATE INDEX "acquirers_company_id_index" ON "acquirers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "budgets_company_id_index" ON "budgets" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "cashAccounts_company_id_index" ON "cashAccounts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "cashAccounts_type_index" ON "cashAccounts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "cashMovements_company_id_index" ON "cashMovements" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "cashMovements_type_index" ON "cashMovements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "cashMovements_cash_account_id_index" ON "cashMovements" USING btree ("cash_account_id");--> statement-breakpoint
CREATE INDEX "cashMovements_person_id_index" ON "cashMovements" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "cashMovements_group_id_index" ON "cashMovements" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "companies_status_index" ON "companies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contasAPagar_company_id_index" ON "contasAPagar" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "contasAPagar_status_index" ON "contasAPagar" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employees_company_id_index" ON "employees" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "employees_position_index" ON "employees" USING btree ("position");--> statement-breakpoint
CREATE INDEX "facilitadores_company_id_index" ON "facilitadores" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "facilitadores_tipo_operacao_index" ON "facilitadores" USING btree ("tipo_operacao");--> statement-breakpoint
CREATE INDEX "facilitadores_modelo_fiscal_index" ON "facilitadores" USING btree ("modelo_fiscal");--> statement-breakpoint
CREATE INDEX "facilitadores_regime_tributario_index" ON "facilitadores" USING btree ("regime_tributario");--> statement-breakpoint
CREATE INDEX "facilitadores_empresa_id_index" ON "facilitadores" USING btree ("empresa_id");--> statement-breakpoint
CREATE INDEX "financialGroups_company_id_index" ON "financialGroups" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "financialGroups_type_index" ON "financialGroups" USING btree ("type");--> statement-breakpoint
CREATE INDEX "financialSubgroups_company_id_index" ON "financialSubgroups" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "financialSubgroups_financial_group_id_index" ON "financialSubgroups" USING btree ("financial_group_id");--> statement-breakpoint
CREATE INDEX "fuelings_company_id_index" ON "fuelings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "orders_company_id_index" ON "orders" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "orders_status_index" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "paymentTypes_company_id_index" ON "paymentTypes" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "paymentTypes_type_index" ON "paymentTypes" USING btree ("type");--> statement-breakpoint
CREATE INDEX "persons_company_id_index" ON "persons" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "persons_type_index" ON "persons" USING btree ("type");--> statement-breakpoint
CREATE INDEX "products_company_id_index" ON "products" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "products_category_index" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "productPickups_company_id_index" ON "productPickups" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "productPickups_status_index" ON "productPickups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "productStocks_company_id_index" ON "productStocks" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "productStocks_product_id_index" ON "productStocks" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "productStocks_sector_id_index" ON "productStocks" USING btree ("sector_id");--> statement-breakpoint
CREATE INDEX "purchases_company_id_index" ON "purchases" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "sales_company_id_index" ON "sales" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "sectors_company_id_index" ON "sectors" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "sectorMasters_company_id_index" ON "sectorMasters" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "stockTransfers_company_id_index" ON "stockTransfers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "company_id_index" ON "users" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "email_index" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "cpf_index" ON "users" USING btree ("cpf");--> statement-breakpoint
CREATE INDEX "vasilhameLoans_company_id_index" ON "vasilhameLoans" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "vehicles_company_id_index" ON "vehicles" USING btree ("company_id");--> statement-breakpoint
CREATE POLICY "accountsReceivables_tenant_isolation" ON "accountsReceivables" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "acquirers_tenant_isolation" ON "acquirers" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "budgets_tenant_isolation" ON "budgets" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "cashAccounts_tenant_isolation" ON "cashAccounts" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "cashMovements_tenant_isolation" ON "cashMovements" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "companies_tenant_isolation" ON "companies" AS PERMISSIVE FOR ALL TO public USING (id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "contasAPagar_tenant_isolation" ON "contasAPagar" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "employees_tenant_isolation" ON "employees" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "facilitadores_tenant_isolation" ON "facilitadores" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "financialGroups_tenant_isolation" ON "financialGroups" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "financialSubgroups_tenant_isolation" ON "financialSubgroups" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "fuelings_tenant_isolation" ON "fuelings" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "orders_tenant_isolation" ON "orders" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "paymentTypes_tenant_isolation" ON "paymentTypes" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "persons_tenant_isolation" ON "persons" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "products_tenant_isolation" ON "products" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "productPickups_tenant_isolation" ON "productPickups" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "productStocks_tenant_isolation" ON "productStocks" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "purchases_tenant_isolation" ON "purchases" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "productStocks_tenant_isolation" ON "sales" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "sectors_tenant_isolation" ON "sectors" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "sectorMasters_tenant_isolation" ON "sectorMasters" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "stockTransfers_tenant_isolation" ON "stockTransfers" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "users_tenant_isolation" ON "users" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "select user to login" ON "users" AS PERMISSIVE FOR SELECT TO public USING (current_setting('app.current_company_id', true)::uuid = '');--> statement-breakpoint
CREATE POLICY "vasilhameLoans_tenant_isolation" ON "vasilhameLoans" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "vehicles_tenant_isolation" ON "vehicles" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);