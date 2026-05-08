ALTER TABLE "accountsReceivables" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "accountsReceivables" SET "active" = not active;--> statement-breakpoint

ALTER TABLE "budgets" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "budgets" SET "active" = not active;--> statement-breakpoint

ALTER TABLE "cashMovements" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "cashMovements" SET "active" = not active;--> statement-breakpoint

ALTER TABLE "companies" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "companies" SET "active" = not active;--> statement-breakpoint

ALTER TABLE "contasAPagar" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "contasAPagar" SET "active" = not active;--> statement-breakpoint

ALTER TABLE "facilitadores" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "facilitadores" SET "active" = not active;--> statement-breakpoint

ALTER TABLE "fuelings" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "fuelings" SET "active" = not active;--> statement-breakpoint

ALTER TABLE "orders" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "orders" SET "active" = not active;--> statement-breakpoint
ALTER TABLE "productPickups" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "productPickups" SET "active" = not active;--> statement-breakpoint
ALTER TABLE "productStocks" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "productStocks" SET "active" = not active;--> statement-breakpoint
ALTER TABLE "purchases" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "purchases" SET "active" = not active;--> statement-breakpoint
ALTER TABLE "sales" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "sales" SET "active" = not active;--> statement-breakpoint
ALTER TABLE "sectorMasters" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "sectorMasters" SET "active" = not active;--> statement-breakpoint
ALTER TABLE "stockTransfers" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "stockTransfers" SET "active" = not active;--> statement-breakpoint
ALTER TABLE "vasilhameLoans" RENAME COLUMN "deleted" TO "active";--> statement-breakpoint
UPDATE "vasilhameLoans" SET "active" = not active;--> statement-breakpoint
ALTER TABLE "accountsReceivables" ALTER COLUMN "installment_number" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "acquirers" ALTER COLUMN "fee_percentage" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "acquirers" ALTER COLUMN "settlement_days" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "budgets" ALTER COLUMN "total_amount" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "cashAccounts" ALTER COLUMN "balance" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "cashAccounts" ALTER COLUMN "initial_balance" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "total_amount" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "paymentTypes" ALTER COLUMN "max_installments" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "paymentTypes" ALTER COLUMN "days_interval" SET DEFAULT 30;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "cost_price" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "valor_sem_icms_kg" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "kg_por_unidade_glp" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "percentual_glp" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "percentual_gn_nacional" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "percentual_gn_importado" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "peso_liquido" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "peso_bruto" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "productPickups" ALTER COLUMN "collected_quantity" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "vasilhameLoans" ALTER COLUMN "returned_quantity" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "initial_km" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "subgroup_id" uuid;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "subgroup_name" text;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "document_number" text;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "competence_month" text;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "payment_type_id" uuid;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "payment_type_name" text;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "is_accounting" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "sector_id" uuid;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "sector_name" text;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD COLUMN "installment_number" numeric;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD COLUMN "payment_type_id" uuid;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD COLUMN "payment_type_name" text;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD COLUMN "purchase_id" uuid;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD COLUMN "nfe_number" text;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD COLUMN "group_name" text;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD COLUMN "subgroup_id" uuid;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD COLUMN "subgroup_name" text;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD COLUMN "document_number" text;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD COLUMN "reagendamento_motivo" text;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD COLUMN "reagendamento_data" date;--> statement-breakpoint
ALTER TABLE "financialSubgroups" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "canal" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "urgente" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "convenio" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "stockTransfers" ADD COLUMN "transfer_number" text;--> statement-breakpoint
ALTER TABLE "stockTransfers" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD CONSTRAINT "cashMovements_payment_type_id_paymentTypes_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."paymentTypes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD CONSTRAINT "contasAPagar_payment_type_id_paymentTypes_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."paymentTypes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD CONSTRAINT "contasAPagar_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquirers" DROP COLUMN "deleted";--> statement-breakpoint
ALTER TABLE "cashAccounts" DROP COLUMN "deleted";--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "deleted";--> statement-breakpoint
ALTER TABLE "facilitadores" DROP COLUMN "ativo";--> statement-breakpoint
ALTER TABLE "financialGroups" DROP COLUMN "deleted";--> statement-breakpoint
ALTER TABLE "financialSubgroups" DROP COLUMN "deleted";--> statement-breakpoint
ALTER TABLE "paymentTypes" DROP COLUMN "deleted";--> statement-breakpoint
ALTER TABLE "persons" DROP COLUMN "deleted";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "deleted";--> statement-breakpoint
ALTER TABLE "sectors" DROP COLUMN "deleted";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "deleted";--> statement-breakpoint
ALTER TABLE "vehicles" DROP COLUMN "deleted";