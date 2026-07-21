ALTER TABLE "accountsReceivables" DROP CONSTRAINT "accountsReceivables_person_id_persons_id_fk";
--> statement-breakpoint
ALTER TABLE "accountsReceivables" DROP CONSTRAINT "accountsReceivables_sale_id_sales_id_fk";
--> statement-breakpoint
ALTER TABLE "accountsReceivables" DROP CONSTRAINT "accountsReceivables_payment_type_id_paymentTypes_id_fk";
--> statement-breakpoint
ALTER TABLE "accountsReceivables" DROP CONSTRAINT "accountsReceivables_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "acquirers" DROP CONSTRAINT "acquirers_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "budgets" DROP CONSTRAINT "budgets_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "cashAccounts" DROP CONSTRAINT "cashAccounts_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "cashMovements" DROP CONSTRAINT "cashMovements_cash_account_id_cashAccounts_id_fk";
--> statement-breakpoint
ALTER TABLE "cashMovements" DROP CONSTRAINT "cashMovements_person_id_persons_id_fk";
--> statement-breakpoint
ALTER TABLE "cashMovements" DROP CONSTRAINT "cashMovements_payment_type_id_paymentTypes_id_fk";
--> statement-breakpoint
ALTER TABLE "cashMovements" DROP CONSTRAINT "cashMovements_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "contasAPagar" DROP CONSTRAINT "contasAPagar_payment_type_id_paymentTypes_id_fk";
--> statement-breakpoint
ALTER TABLE "contasAPagar" DROP CONSTRAINT "contasAPagar_purchase_id_purchases_id_fk";
--> statement-breakpoint
ALTER TABLE "contasAPagar" DROP CONSTRAINT "contasAPagar_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "employees" DROP CONSTRAINT "employees_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "facilitadores" DROP CONSTRAINT "facilitadores_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "financialGroups" DROP CONSTRAINT "financialGroups_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "financialSubgroups" DROP CONSTRAINT "financialSubgroups_financial_group_id_financialGroups_id_fk";
--> statement-breakpoint
ALTER TABLE "financialSubgroups" DROP CONSTRAINT "financialSubgroups_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "fuelings" DROP CONSTRAINT "fuelings_vehicle_id_vehicles_id_fk";
--> statement-breakpoint
ALTER TABLE "fuelings" DROP CONSTRAINT "fuelings_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_person_id_persons_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_employee_id_employees_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_payment_type_id_paymentTypes_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_cash_account_id_cashAccounts_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "paymentTypes" DROP CONSTRAINT "paymentTypes_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "paymentTypes" DROP CONSTRAINT "paymentTypes_acquirer_id_acquirers_id_fk";
--> statement-breakpoint
ALTER TABLE "persons" DROP CONSTRAINT "persons_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "productPickups" DROP CONSTRAINT "productPickups_sale_id_sales_id_fk";
--> statement-breakpoint
ALTER TABLE "productPickups" DROP CONSTRAINT "productPickups_person_id_persons_id_fk";
--> statement-breakpoint
ALTER TABLE "productPickups" DROP CONSTRAINT "productPickups_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "productPickups" DROP CONSTRAINT "productPickups_sector_id_sectors_id_fk";
--> statement-breakpoint
ALTER TABLE "productPickups" DROP CONSTRAINT "productPickups_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "productStocks" DROP CONSTRAINT "productStocks_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "productStocks" DROP CONSTRAINT "productStocks_sector_id_sectors_id_fk";
--> statement-breakpoint
ALTER TABLE "productStocks" DROP CONSTRAINT "productStocks_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "productStockMovements" DROP CONSTRAINT "productStockMovements_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "productStockMovements" DROP CONSTRAINT "productStockMovements_sector_id_sectors_id_fk";
--> statement-breakpoint
ALTER TABLE "productStockMovements" DROP CONSTRAINT "productStockMovements_sale_id_sales_id_fk";
--> statement-breakpoint
ALTER TABLE "productStockMovements" DROP CONSTRAINT "productStockMovements_purchase_id_purchases_id_fk";
--> statement-breakpoint
ALTER TABLE "productStockMovements" DROP CONSTRAINT "productStockMovements_stock_transfer_id_stockTransfers_id_fk";
--> statement-breakpoint
ALTER TABLE "productStockMovements" DROP CONSTRAINT "productStockMovements_product_pickup_id_productPickups_id_fk";
--> statement-breakpoint
ALTER TABLE "productStockMovements" DROP CONSTRAINT "productStockMovements_vasilhame_loan_id_vasilhameLoans_id_fk";
--> statement-breakpoint
ALTER TABLE "productStockMovements" DROP CONSTRAINT "productStockMovements_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "purchaseItems" DROP CONSTRAINT "purchaseItems_purchase_id_purchases_id_fk";
--> statement-breakpoint
ALTER TABLE "purchaseItems" DROP CONSTRAINT "purchaseItems_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "purchaseItems" DROP CONSTRAINT "purchaseItems_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "sales" DROP CONSTRAINT "sales_person_id_persons_id_fk";
--> statement-breakpoint
ALTER TABLE "sales" DROP CONSTRAINT "sales_sector_id_sectors_id_fk";
--> statement-breakpoint
ALTER TABLE "sales" DROP CONSTRAINT "sales_order_id_orders_id_fk";
--> statement-breakpoint
ALTER TABLE "sales" DROP CONSTRAINT "sales_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "saleItems" DROP CONSTRAINT "saleItems_sale_id_sales_id_fk";
--> statement-breakpoint
ALTER TABLE "saleItems" DROP CONSTRAINT "saleItems_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "saleItems" DROP CONSTRAINT "saleItems_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "sectors" DROP CONSTRAINT "sectors_employee_id_employees_id_fk";
--> statement-breakpoint
ALTER TABLE "sectors" DROP CONSTRAINT "sectors_master_sector_id_sectorMasters_id_fk";
--> statement-breakpoint
ALTER TABLE "sectors" DROP CONSTRAINT "sectors_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "sectorMasters" DROP CONSTRAINT "sectorMasters_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "stockTransfers" DROP CONSTRAINT "stockTransfers_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "stockTransfers" DROP CONSTRAINT "stockTransfers_from_sector_id_sectors_id_fk";
--> statement-breakpoint
ALTER TABLE "stockTransfers" DROP CONSTRAINT "stockTransfers_to_sector_id_sectors_id_fk";
--> statement-breakpoint
ALTER TABLE "stockTransfers" DROP CONSTRAINT "stockTransfers_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "vasilhameLoans" DROP CONSTRAINT "vasilhameLoans_sale_id_sales_id_fk";
--> statement-breakpoint
ALTER TABLE "vasilhameLoans" DROP CONSTRAINT "vasilhameLoans_person_id_persons_id_fk";
--> statement-breakpoint
ALTER TABLE "vasilhameLoans" DROP CONSTRAINT "vasilhameLoans_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "vehicles" DROP CONSTRAINT "vehicles_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "nfe_number" text;--> statement-breakpoint
ALTER TABLE "vasilhameLoans" ADD COLUMN "sector_id" uuid;--> statement-breakpoint
ALTER TABLE "vasilhameLoans" ADD COLUMN "sector_name" text;--> statement-breakpoint
ALTER TABLE "vasilhameLoans" ADD COLUMN "return_date" date;--> statement-breakpoint
ALTER TABLE "accountsReceivables" ADD CONSTRAINT "accountsReceivables_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accountsReceivables" ADD CONSTRAINT "accountsReceivables_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accountsReceivables" ADD CONSTRAINT "accountsReceivables_payment_type_id_paymentTypes_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."paymentTypes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accountsReceivables" ADD CONSTRAINT "accountsReceivables_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acquirers" ADD CONSTRAINT "acquirers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashAccounts" ADD CONSTRAINT "cashAccounts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD CONSTRAINT "cashMovements_cash_account_id_cashAccounts_id_fk" FOREIGN KEY ("cash_account_id") REFERENCES "public"."cashAccounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD CONSTRAINT "cashMovements_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD CONSTRAINT "cashMovements_payment_type_id_paymentTypes_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."paymentTypes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashMovements" ADD CONSTRAINT "cashMovements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD CONSTRAINT "contasAPagar_payment_type_id_paymentTypes_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."paymentTypes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD CONSTRAINT "contasAPagar_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contasAPagar" ADD CONSTRAINT "contasAPagar_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "facilitadores" ADD CONSTRAINT "facilitadores_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financialGroups" ADD CONSTRAINT "financialGroups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financialSubgroups" ADD CONSTRAINT "financialSubgroups_financial_group_id_financialGroups_id_fk" FOREIGN KEY ("financial_group_id") REFERENCES "public"."financialGroups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financialSubgroups" ADD CONSTRAINT "financialSubgroups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuelings" ADD CONSTRAINT "fuelings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fuelings" ADD CONSTRAINT "fuelings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_type_id_paymentTypes_id_fk" FOREIGN KEY ("payment_type_id") REFERENCES "public"."paymentTypes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cash_account_id_cashAccounts_id_fk" FOREIGN KEY ("cash_account_id") REFERENCES "public"."cashAccounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentTypes" ADD CONSTRAINT "paymentTypes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentTypes" ADD CONSTRAINT "paymentTypes_acquirer_id_acquirers_id_fk" FOREIGN KEY ("acquirer_id") REFERENCES "public"."acquirers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productPickups" ADD CONSTRAINT "productPickups_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productPickups" ADD CONSTRAINT "productPickups_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productPickups" ADD CONSTRAINT "productPickups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productPickups" ADD CONSTRAINT "productPickups_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productPickups" ADD CONSTRAINT "productPickups_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStocks" ADD CONSTRAINT "productStocks_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStocks" ADD CONSTRAINT "productStocks_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStocks" ADD CONSTRAINT "productStocks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_stock_transfer_id_stockTransfers_id_fk" FOREIGN KEY ("stock_transfer_id") REFERENCES "public"."stockTransfers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_product_pickup_id_productPickups_id_fk" FOREIGN KEY ("product_pickup_id") REFERENCES "public"."productPickups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_vasilhame_loan_id_vasilhameLoans_id_fk" FOREIGN KEY ("vasilhame_loan_id") REFERENCES "public"."vasilhameLoans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productStockMovements" ADD CONSTRAINT "productStockMovements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchaseItems" ADD CONSTRAINT "purchaseItems_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchaseItems" ADD CONSTRAINT "purchaseItems_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchaseItems" ADD CONSTRAINT "purchaseItems_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saleItems" ADD CONSTRAINT "saleItems_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saleItems" ADD CONSTRAINT "saleItems_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saleItems" ADD CONSTRAINT "saleItems_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_master_sector_id_sectorMasters_id_fk" FOREIGN KEY ("master_sector_id") REFERENCES "public"."sectorMasters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sectorMasters" ADD CONSTRAINT "sectorMasters_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stockTransfers" ADD CONSTRAINT "stockTransfers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stockTransfers" ADD CONSTRAINT "stockTransfers_from_sector_id_sectors_id_fk" FOREIGN KEY ("from_sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stockTransfers" ADD CONSTRAINT "stockTransfers_to_sector_id_sectors_id_fk" FOREIGN KEY ("to_sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stockTransfers" ADD CONSTRAINT "stockTransfers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vasilhameLoans" ADD CONSTRAINT "vasilhameLoans_sector_id_sectors_id_fk" FOREIGN KEY ("sector_id") REFERENCES "public"."sectors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vasilhameLoans" ADD CONSTRAINT "vasilhameLoans_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vasilhameLoans" ADD CONSTRAINT "vasilhameLoans_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vasilhameLoans" ADD CONSTRAINT "vasilhameLoans_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;