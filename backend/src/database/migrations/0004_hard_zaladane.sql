ALTER TABLE "accountsReceivables" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "sale_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "paymentTypes" ADD COLUMN "acquirer_id" uuid;--> statement-breakpoint
ALTER TABLE "paymentTypes" ADD CONSTRAINT "paymentTypes_acquirer_id_acquirers_id_fk" FOREIGN KEY ("acquirer_id") REFERENCES "public"."acquirers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "paymentTypes_acquirer_id_index" ON "paymentTypes" USING btree ("acquirer_id");