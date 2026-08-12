DROP INDEX "productStocks_product_id_sector_id_unique";--> statement-breakpoint
ALTER TABLE "productStocks" ALTER COLUMN "sector_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "productStockMovements" ALTER COLUMN "sector_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "productStocks" ADD COLUMN "sector_master_id" uuid;--> statement-breakpoint
ALTER TABLE "productStocks" ADD COLUMN "sector_master_name" text;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD COLUMN "sector_master_id" uuid;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD COLUMN "sector_master_name" text;--> statement-breakpoint
ALTER TABLE "productStocks" ADD CONSTRAINT "productStocks_sector_master_id_sectorMasters_id_fk" FOREIGN KEY ("sector_master_id") REFERENCES "public"."sectorMasters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_sector_master_id_sectorMasters_id_fk" FOREIGN KEY ("sector_master_id") REFERENCES "public"."sectorMasters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "productStocks_sector_master_id_index" ON "productStocks" USING btree ("sector_master_id");--> statement-breakpoint
CREATE INDEX "productStockMovements_sector_master_id_index" ON "productStockMovements" USING btree ("sector_master_id");--> statement-breakpoint
CREATE INDEX "productStockMovements_sale_id_index" ON "productStockMovements" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "productStockMovements_purchase_id_index" ON "productStockMovements" USING btree ("purchase_id");--> statement-breakpoint
CREATE UNIQUE INDEX "productStocks_product_id_sector_id_unique" ON "productStocks" USING btree ("product_id","sector_id","sector_master_id");--> statement-breakpoint
ALTER TABLE "productStockMovements" DROP COLUMN "active";