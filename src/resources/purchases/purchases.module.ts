import { Module } from '@nestjs/common'
import { PurchasEsesService } from './purchases.service'
import { PurchasEsesController } from './purchases.controller'

@Module({
  providers: [PurchasEsesService],
  controllers: [PurchasEsesController],
})
export class PurchasEsesModule {}
