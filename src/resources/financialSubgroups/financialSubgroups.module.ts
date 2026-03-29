import { Module } from '@nestjs/common'
import { FinancialsubgroupsService } from './financialSubgroups.service'
import { FinancialsubgroupsController } from './financialSubgroups.controller'

@Module({
  providers: [FinancialsubgroupsService],
  controllers: [FinancialsubgroupsController],
})
export class FinancialsubgroupsModule {}
