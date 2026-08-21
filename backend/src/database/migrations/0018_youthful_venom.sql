ALTER TABLE "purchases" ADD COLUMN "sector_id" uuid;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "sector_name" text;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;