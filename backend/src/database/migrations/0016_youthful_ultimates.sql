ALTER TABLE "cashMovements" ADD COLUMN "sector_master_id" uuid;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "sector_master_name" text;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD COLUMN "purchase_id" uuid;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD CONSTRAINT "cashMovements_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;