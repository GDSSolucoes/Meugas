import { Module } from '@nestjs/common'
import { ProductstockmovementsService } from './productStockMovements.service'
import { ProductstockmovementsController } from './productStockMovements.controller'

@Module({
  providers: [ProductstockmovementsService],
  controllers: [ProductstockmovementsController],
})
export class ProductstockmovementsModule {}
