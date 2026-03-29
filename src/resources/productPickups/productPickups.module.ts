import { Module } from '@nestjs/common'
import { ProductpickupsService } from './productPickups.service'
import { ProductpickupsController } from './productPickups.controller'

@Module({
  providers: [ProductpickupsService],
  controllers: [ProductpickupsController],
})
export class ProductpickupsModule {}
