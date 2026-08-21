DROP INDEX "productStocks_product_id_sector_id_unique";--> statement-breakpoint
ALTER TABLE "productStocks" ADD COLUMN "owner_sector_id" uuid;--> statement-breakpoint
ALTER TABLE "productStocks" ADD CONSTRAINT "productStocks_owner_sector_id_sectors_id_fk" FOREIGN KEY ("owner_sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "productStocks_owner_sector_id_index" ON "productStocks" USING btree ("owner_sector_id");--> statement-breakpoint
CREATE UNIQUE INDEX "productStocks_product_id_owner_sector_id_unique" ON "productStocks" USING btree ("product_id","owner_sector_id");