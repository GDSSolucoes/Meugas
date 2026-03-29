import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CqrsModule } from '@nestjs/cqrs'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './resources/users/users.module'
import { DatabaseModule } from './database/database.module'
import { CompaniesModule } from './resources/companies/companies.module'
import { ProductsModule } from './resources/products/products.module'
import { VehiclesModule } from './resources/vehicles/vehicles.module'
import { CqrsAppModule } from './cqrs/cqrs.module'
import { HttpErrorInterceptor } from './interceptors/http-error.interceptor'
import { AccountsreceivablEsesModule } from './resources/accountsReceivables/accountsReceivables.module'
import { AcquirersModule } from './resources/acquirers/acquirers.module'
import { BudgetsModule } from './resources/budgets/budgets.module'
import { CashaccountsModule } from './resources/cashAccounts/cashAccounts.module'
import { CashmovementsModule } from './resources/cashMovements/cashMovements.module'
import { ContasapagarsModule } from './resources/contasAPagar/contasAPagar.module'
import { EmployeEsesModule } from './resources/employees/employees.module'
import { FacilitadorEsesModule } from './resources/facilitadores/facilitadores.module'
import { FinancialgroupsModule } from './resources/financialGroups/financialGroups.module'
import { FinancialsubgroupsModule } from './resources/financialSubgroups/financialSubgroups.module'
import { FuelingsModule } from './resources/fuelings/fuelings.module'
import { OrdersModule } from './resources/orders/orders.module'
import { PaymenttypEsesModule } from './resources/paymentTypes/paymentTypes.module'
import { PersonsModule } from './resources/persons/persons.module'
import { ProductpickupsModule } from './resources/productPickups/productPickups.module'
import { ProductstocksModule } from './resources/productStocks/productStocks.module'
import { PurchasEsesModule } from './resources/purchases/purchases.module'
import { SalEsesModule } from './resources/sales/sales.module'
import { SectorsModule } from './resources/sectors/sectors.module'
import { SectormastersModule } from './resources/sectorMasters/sectorMasters.module'
import { StocktransfersModule } from './resources/stockTransfers/stockTransfers.module'
import { VasilhameloansModule } from './resources/vasilhameLoans/vasilhameLoans.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CqrsModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    CompaniesModule,
    ProductsModule,
    VehiclesModule,
    CqrsAppModule,
    AccountsreceivablEsesModule,
    AcquirersModule,
    BudgetsModule,
    CashaccountsModule,
    CashmovementsModule,
    ContasapagarsModule,
    EmployeEsesModule,
    FacilitadorEsesModule,
    FinancialgroupsModule,
    FinancialsubgroupsModule,
    FuelingsModule,
    OrdersModule,
    PaymenttypEsesModule,
    PersonsModule,
    ProductpickupsModule,
    ProductstocksModule,
    PurchasEsesModule,
    SalEsesModule,
    SectorsModule,
    SectormastersModule,
    StocktransfersModule,
    VasilhameloansModule],
  providers: [HttpErrorInterceptor]
})
export class AppModule {}
