import { Module } from '@nestjs/common'
import { CashaccountsService } from './cashAccounts.service'
import { CashaccountsController } from './cashAccounts.controller'

@Module({
  providers: [CashaccountsService],
  controllers: [CashaccountsController],
})
export class CashaccountsModule {}
