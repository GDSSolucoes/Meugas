CREATE TABLE "saleItems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid,
	"product_code" text,
	"product_name" text,
	"category" text,
	"vasilhame_id" uuid,
	"vasilhame_name" text,
	"quantity" numeric,
	"unit_price" numeric,
	"discount" numeric,
	"total" numeric,
	"quantity_to_pickup" numeric,
	"vasilhame_loan_quantity" numeric,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "saleItems" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "saleItems" ADD CONSTRAINT "saleItems_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saleItems" ADD CONSTRAINT "saleItems_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saleItems" ADD CONSTRAINT "saleItems_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saleItems_sale_id_index" ON "saleItems" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "saleItems_product_id_index" ON "saleItems" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "saleItems_company_id_index" ON "saleItems" USING btree ("company_id");--> statement-breakpoint
CREATE POLICY "saleItems_tenant_isolation" ON "saleItems" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);