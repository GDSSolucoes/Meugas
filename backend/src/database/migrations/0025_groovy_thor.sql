ALTER TYPE "public"."stock_movement_type" ADD VALUE 'order';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "sector_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "sector_name" text;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD COLUMN "order_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "productStockMovements_order_id_index" ON "productStockMovements" USING btree ("order_id");