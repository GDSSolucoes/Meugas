import { Module } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'
import { GetOrdersReportHandler } from './handlers/get-orders-report.handler'
import { FilteraccountsReceivablesHandler } from './handlers/filter-accounts-receivable.handler'
import { ReportsController } from './controllers/reports.controller'

@Module({
  imports: [CqrsModule],
  providers: [GetOrdersReportHandler, FilteraccountsReceivablesHandler],
  controllers: [ReportsController],
})
export class CqrsAppModule {}