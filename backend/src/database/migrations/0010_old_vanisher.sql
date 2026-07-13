CREATE TYPE "public"."stock_movement_type" AS ENUM('sale', 'purchase', 'transfer', 'pickup', 'loan');--> statement-breakpoint
CREATE TABLE "productStockMovements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" text,
	"sector_id" uuid NOT NULL,
	"sector_name" text,
	"type" "stock_movement_type" NOT NULL,
	"sale_id" uuid,
	"purchase_id" uuid,
	"stock_transfer_id" uuid,
	"product_pickup_id" uuid,
	"vasilhame_loan_id" uuid,
	"quantity" numeric NOT NULL,
	"previous_balance" numeric,
	"new_balance" numeric,
	"movement_date" timestamp with time zone NOT NULL,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "productStockMovements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_stock_transfer_id_stockTransfers_id_fk" FOREIGN KEY ("stock_transfer_id") REFERENCES "public"."stockTransfers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_product_pickup_id_productPickups_id_fk" FOREIGN KEY ("product_pickup_id") REFERENCES "public"."productPickups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_vasilhame_loan_id_vasilhameLoans_id_fk" FOREIGN KEY ("vasilhame_loan_id") REFERENCES "public"."vasilhameLoans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "productStockMovements_company_id_index" ON "productStockMovements" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "productStockMovements_product_id_index" ON "productStockMovements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "productStockMovements_sector_id_index" ON "productStockMovements" USING btree ("sector_id");--> statement-breakpoint
CREATE INDEX "productStockMovements_movement_date_index" ON "productStockMovements" USING btree ("movement_date");--> statement-breakpoint
CREATE INDEX "productStockMovements_type_index" ON "productStockMovements" USING btree ("type");--> statement-breakpoint
CREATE POLICY "productStockMovements_tenant_isolation" ON "productStockMovements" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);