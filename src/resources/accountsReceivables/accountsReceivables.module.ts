import { Module } from '@nestjs/common'
import { AccountsreceivablEsesService } from './accountsReceivables.service'
import { AccountsreceivablEsesController } from './accountsReceivables.controller'

@Module({
  providers: [AccountsreceivablEsesService],
  controllers: [AccountsreceivablEsesController],
})
export class AccountsreceivablEsesModule {}
