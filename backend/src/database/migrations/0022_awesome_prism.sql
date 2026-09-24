CREATE TABLE "budgetItems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"budget_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" numeric NOT NULL,
	"unit_price" numeric NOT NULL,
	"total" numeric NOT NULL,
	"company_id" uuid NOT NULL,
	"company_name" text,
	"active" boolean DEFAULT true,
	"created_by_name" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "budgetItems" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "person_id" uuid;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "person_name" text;--> statement-breakpoint
ALTER TABLE "budgetItems" ADD CONSTRAINT "budgetItems_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetItems" ADD CONSTRAINT "budgetItems_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetItems" ADD CONSTRAINT "budgetItems_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budgetItems_budget_id_index" ON "budgetItems" USING btree ("budget_id");--> statement-breakpoint
CREATE INDEX "budgetItems_product_id_index" ON "budgetItems" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "budgetItems_company_id_index" ON "budgetItems" USING btree ("company_id");--> statement-breakpoint
UPDATE "budgets" b
SET "person_id" = p.id
FROM "persons" p
WHERE p.company_id = b.company_id
	AND p.type = 'cliente'
	AND lower(p.name) = lower(b.customer_data->>'name')
	AND NOT EXISTS (
		SELECT 1
		FROM "persons" p2
		WHERE p2.company_id = b.company_id
			AND p2.type = 'cliente'
			AND lower(p2.name) = lower(b.customer_data->>'name')
			AND p2.id < p.id
	);
--> statement-breakpoint
INSERT INTO "budgetItems" (
	"budget_id", "product_id", "quantity", "unit_price", "total",
	"company_id", "company_name", "created_by_name"
)
SELECT
	b.id,
	p.id,
	(item->>'quantity')::numeric,
	(item->>'unitPrice')::numeric,
	(item->>'total')::numeric,
	b.company_id,
	b.company_name,
	b.created_by_name
FROM "budgets" b
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(b.items::jsonb, '[]'::jsonb)) AS item
JOIN "products" p
	ON p.id = (item->>'productId')::uuid
	AND p.company_id = b.company_id
WHERE item->>'productId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" DROP COLUMN "customer_data";--> statement-breakpoint
ALTER TABLE "budgets" DROP COLUMN "items";--> statement-breakpoint
CREATE POLICY "budgetItems_tenant_isolation" ON "budgetItems" AS PERMISSIVE FOR ALL TO public USING (company_id = current_setting('app.current_company_id', true)::uuid) WITH CHECK (company_id = current_setting('app.current_company_id', true)::uuid);