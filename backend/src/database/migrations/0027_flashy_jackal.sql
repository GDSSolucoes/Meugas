ALTER TABLE "employees" ADD COLUMN "sector_id" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employees_sector_id_index" ON "employees" USING btree ("sector_id");