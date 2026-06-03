ALTER TABLE "paymentTypes"
  ADD COLUMN "acquirer_id" uuid;

ALTER TABLE "paymentTypes"
  ADD CONSTRAINT "paymentTypes_acquirer_id_acquirers_id_fk"
  FOREIGN KEY ("acquirer_id") REFERENCES "public"."acquirers"("id") ON DELETE SET NULL;

CREATE INDEX "paymentTypes_acquirer_id_index" ON "paymentTypes" ("acquirer_id");
