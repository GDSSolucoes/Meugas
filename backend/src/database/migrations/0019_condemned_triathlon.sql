ALTER TABLE "productStocks" DROP CONSTRAINT "productStocks_owner_sector_id_sectors_id_fk";
--> statement-breakpoint
DROP INDEX "productStocks_owner_sector_id_index";--> statement-breakpoint
DROP INDEX "productStocks_product_id_owner_sector_id_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "productStocks_product_id_sector_id_unique" ON "productStocks" USING btree ("product_id","sector_id");--> statement-breakpoint
ALTER TABLE "productStocks" DROP COLUMN "owner_sector_id";