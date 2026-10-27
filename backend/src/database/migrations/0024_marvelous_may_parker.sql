CREATE TABLE "orderItems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"product_name" text,
	"quantity" numeric,
	"unit_price" numeric,
	"discount" numeric,
	"total" numeric,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "orderItems" ADD CONSTRAINT "orderItems_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItems" ADD CONSTRAINT "orderItems_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orderItems" ADD CONSTRAINT "orderItems_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orderItems_order_id_index" ON "orderItems" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orderItems_product_id_index" ON "orderItems" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orderItems_company_id_index" ON "orderItems" USING btree ("company_id");--> statement-breakpoint
INSERT INTO "orderItems" (
	"order_id",
	"product_id",
	"product_name",
	"quantity",
	"unit_price",
	"discount",
	"total",
	"company_id",
	"company_name"
)
SELECT
	o.id,
	p.id,
	item.value->>'productName',
	NULLIF(item.value->>'quantity', '')::numeric,
	NULLIF(item.value->>'unitPrice', '')::numeric,
	NULLIF(item.value->>'discount', '')::numeric,
	NULLIF(item.value->>'total', '')::numeric,
	o.company_id,
	o.company_name
FROM orders o
CROSS JOIN LATERAL jsonb_array_elements(
	CASE
		WHEN jsonb_typeof(o.items::jsonb) = 'array' THEN o.items::jsonb
		ELSE '[]'::jsonb
	END
) AS item(value)
LEFT JOIN products p
	ON p.id = CASE
		WHEN item.value->>'productId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
		THEN (item.value->>'productId')::uuid
	END
	AND p.company_id = o.company_id
WHERE o.items IS NOT NULL
	AND jsonb_typeof(o.items::jsonb) = 'array';
--> statement-breakpoint
ALTER TABLE "orderItems" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "orderItems_tenant_isolation" ON "orderItems" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);