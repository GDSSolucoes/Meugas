ALTER TABLE "orders" DROP CONSTRAINT "orders_sector_id_sectors_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "sector_id";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "sector_name";