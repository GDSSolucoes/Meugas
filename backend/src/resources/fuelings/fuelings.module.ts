import { Module } from '@nestjs/common'
import { FuelingsService } from './fuelings.service'
import { FuelingsController } from './fuelings.controller'

@Module({
  providers: [FuelingsService],
  controllers: [FuelingsController],
})
export class FuelingsModule {}
