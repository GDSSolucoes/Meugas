-- Migration 0022: drop sectorMasters table and remove sector_master_id/name columns

BEGIN;

-- Drop indexes that reference sector_master_id
DROP INDEX IF EXISTS productStocks_sector_master_id_index;
DROP INDEX IF EXISTS productStockMovements_sector_master_id_index;
DROP INDEX IF EXISTS productStocks_product_id_sector_id_unique;

-- Drop sector_master columns from productStocks and productStockMovements and cashMovements
ALTER TABLE "productStocks" DROP COLUMN IF EXISTS "sector_master_id";
ALTER TABLE "productStocks" DROP COLUMN IF EXISTS "sector_master_name";

ALTER TABLE "productStockMovements" DROP COLUMN IF EXISTS "sector_master_id";
ALTER TABLE "productStockMovements" DROP COLUMN IF EXISTS "sector_master_name";

ALTER TABLE "cashMovements" DROP COLUMN IF EXISTS "sector_master_id";
ALTER TABLE "cashMovements" DROP COLUMN IF EXISTS "sector_master_name";

-- If a legacy unique index still exists, recreate a simpler unique index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c WHERE c.relname = 'productStocks_product_id_owner_sector_id_unique'
  ) THEN
    CREATE UNIQUE INDEX productStocks_product_id_owner_sector_id_unique ON "productStocks" ("product_id", "owner_sector_id");
  END IF;
END$$;

-- Finally drop sectorMasters table
DROP TABLE IF EXISTS "sectorMasters" CASCADE;

COMMIT;
