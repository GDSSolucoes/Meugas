-- Migration 0021: import missing sectorMasters as sectors (preserve ids)

BEGIN;

-- Insert sectorMasters into sectors for any master id not present in sectors
INSERT INTO "sectors" (
  id, name, employee_id, employee_name, is_own_stock, master_sector_id, master_sector_name,
  company_id, company_name, active, created_by_name, created_at
)
SELECT
  sm.id,
  sm.name,
  NULL,
  NULL,
  TRUE,
  NULL,
  NULL,
  sm.company_id,
  sm.company_name,
  sm.active,
  sm.created_by_name,
  sm.created_at
FROM "sectorMasters" sm
WHERE NOT EXISTS (SELECT 1 FROM "sectors" s WHERE s.id = sm.id);

COMMIT;
