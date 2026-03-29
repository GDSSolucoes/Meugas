import { Module } from '@nestjs/common'
import { ProductstocksService } from './productStocks.service'
import { ProductstocksController } from './productStocks.controller'

@Module({
  providers: [ProductstocksService],
  controllers: [ProductstocksController],
})
export class ProductstocksModule {}
