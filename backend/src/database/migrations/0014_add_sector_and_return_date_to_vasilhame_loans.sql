-- Add sectorId, sectorName and returnDate to vasilhameLoans table
ALTER TABLE "vasilhameLoans" ADD COLUMN "sector_id" uuid REFERENCES "sectors"("id") ON DELETE SET NULL;
ALTER TABLE "vasilhameLoans" ADD COLUMN "sector_name" text;
ALTER TABLE "vasilhameLoans" ADD COLUMN "return_date" date;
