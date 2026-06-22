ALTER TABLE "cashMovements" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "sale_id" uuid;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD CONSTRAINT "cashMovements_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;