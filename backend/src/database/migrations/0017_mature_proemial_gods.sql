ALTER TABLE "sectorMasters" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "sectorMasters_tenant_isolation" ON "sectorMasters" CASCADE;--> statement-breakpoint
DROP TABLE "sectorMasters" CASCADE;--> statement-breakpoint
ALTER TABLE "productStocks" DROP CONSTRAINT "productStocks_sector_master_id_sectorMasters_id_fk";
--> statement-breakpoint
ALTER TABLE "productStockMovements" DROP CONSTRAINT "productStockMovements_sector_master_id_sectorMasters_id_fk";
--> statement-breakpoint
ALTER TABLE "sectors" DROP CONSTRAINT "sectors_master_sector_id_sectorMasters_id_fk";
--> statement-breakpoint
DROP INDEX "productStocks_sector_master_id_index";--> statement-breakpoint
DROP INDEX "productStocks_product_id_sector_id_unique";--> statement-breakpoint
DROP INDEX "productStockMovements_sector_master_id_index";--> statement-breakpoint
ALTER TABLE "productStocks" ADD COLUMN "owner_sector_id" uuid;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD COLUMN "owner_sector_id" uuid;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD COLUMN "actor_sector_id" uuid;--> statement-breakpoint
ALTER TABLE "productStocks" ADD CONSTRAINT "productStocks_owner_sector_id_sectors_id_fk" FOREIGN KEY ("owner_sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_owner_sector_id_sectors_id_fk" FOREIGN KEY ("owner_sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_actor_sector_id_sectors_id_fk" FOREIGN KEY ("actor_sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "productStocks_owner_sector_id_index" ON "productStocks" USING btree ("owner_sector_id");--> statement-breakpoint
CREATE UNIQUE INDEX "productStocks_product_id_owner_sector_id_unique" ON "productStocks" USING btree ("product_id","owner_sector_id");--> statement-breakpoint
CREATE INDEX "productStockMovements_owner_sector_id_index" ON "productStockMovements" USING btree ("owner_sector_id");--> statement-breakpoint
CREATE INDEX "productStockMovements_actor_sector_id_index" ON "productStockMovements" USING btree ("actor_sector_id");--> statement-breakpoint
ALTER TABLE "cashMovements" DROP COLUMN "sector_master_id";--> statement-breakpoint
ALTER TABLE "cashMovements" DROP COLUMN "sector_master_name";--> statement-breakpoint
ALTER TABLE "productStocks" DROP COLUMN "sector_master_id";--> statement-breakpoint
ALTER TABLE "productStocks" DROP COLUMN "sector_master_name";--> statement-breakpoint
ALTER TABLE "productStockMovements" DROP COLUMN "sector_master_id";--> statement-breakpoint
ALTER TABLE "productStockMovements" DROP COLUMN "sector_master_name";