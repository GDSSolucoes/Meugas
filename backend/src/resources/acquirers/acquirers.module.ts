import { Module } from '@nestjs/common'
import { AcquirersService } from './acquirers.service'
import { AcquirersController } from './acquirers.controller'

@Module({
  providers: [AcquirersService],
  controllers: [AcquirersController],
})
export class AcquirersModule {}
