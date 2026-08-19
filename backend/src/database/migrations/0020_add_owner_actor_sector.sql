-- Migration 0020: add owner_sector_id and actor_sector_id to productStockMovements
-- and owner_sector_id to productStocks, with backfill from existing columns

BEGIN;

ALTER TABLE "productStockMovements"
  ADD COLUMN IF NOT EXISTS "owner_sector_id" uuid REFERENCES "sectors" (id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS "actor_sector_id" uuid REFERENCES "sectors" (id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS productStockMovements_owner_sector_id_index ON "productStockMovements" ("owner_sector_id");
CREATE INDEX IF NOT EXISTS productStockMovements_actor_sector_id_index ON "productStockMovements" ("actor_sector_id");

-- Add owner_sector_id to productStocks
ALTER TABLE "productStocks"
  ADD COLUMN IF NOT EXISTS "owner_sector_id" uuid REFERENCES "sectors" (id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS productStocks_owner_sector_id_index ON "productStocks" ("owner_sector_id");

-- Backfill logic:
-- actor_sector_id should reflect the sector that performed the action (existing sector_id)
-- owner_sector_id should be the sector that actually owns the stock: if the acting sector has its own stock (is_own_stock = true) then owner = sector_id, otherwise owner = sector_master_id (fallback to sector_id)

UPDATE "productStockMovements" psm
SET
  actor_sector_id = psm.sector_id,
  owner_sector_id = CASE
    WHEN psm.sector_id IS NOT NULL AND (
      SELECT s.is_own_stock FROM sectors s WHERE s.id = psm.sector_id
    ) THEN psm.sector_id
    ELSE COALESCE(psm.sector_master_id, psm.sector_id)
  END
WHERE psm.actor_sector_id IS NULL OR psm.owner_sector_id IS NULL;

-- For productStocks, owner is sector if it has own stock, otherwise sector_master
UPDATE "productStocks" ps
SET owner_sector_id = CASE
  WHEN ps.sector_id IS NOT NULL AND (
    SELECT s.is_own_stock FROM sectors s WHERE s.id = ps.sector_id
  ) THEN ps.sector_id
  ELSE COALESCE(ps.sector_master_id, ps.sector_id)
END
WHERE ps.owner_sector_id IS NULL;

-- Add unique index for productStocks by product and owner_sector
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'productStocks_product_id_owner_sector_id_unique'
  ) THEN
    CREATE UNIQUE INDEX productStocks_product_id_owner_sector_id_unique ON "productStocks" ("product_id", "owner_sector_id");
  END IF;
END$$;

COMMIT;
