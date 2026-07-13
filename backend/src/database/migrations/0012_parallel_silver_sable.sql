CREATE TABLE "purchaseItems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"product_id" uuid,
	"product_name" text,
	"quantity" numeric,
	"unit_price" numeric,
	"total" numeric,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"active" boolean DEFAULT true,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "purchaseItems" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "purchaseItems" ADD CONSTRAINT "purchaseItems_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchaseItems" ADD CONSTRAINT "purchaseItems_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchaseItems" ADD CONSTRAINT "purchaseItems_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchaseItems_company_id_index" ON "purchaseItems" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "purchaseItems_product_id_index" ON "purchaseItems" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "purchaseItems_purchase_id_index" ON "purchaseItems" USING btree ("purchase_id");--> statement-breakpoint
CREATE POLICY "purchaseItems_tenant_isolation" ON "purchaseItems" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);