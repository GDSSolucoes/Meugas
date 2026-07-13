import { Module } from '@nestjs/common'
import { PurchaseitemsService } from './purchaseItems.service'
import { PurchaseitemsController } from './purchaseItems.controller'

@Module({
  providers: [PurchaseitemsService],
  controllers: [PurchaseitemsController],
})
export class PurchaseitemsModule {}
