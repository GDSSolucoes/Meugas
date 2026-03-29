import { Module } from '@nestjs/common'
import { SalEsesService } from './sales.service'
import { SalEsesController } from './sales.controller'

@Module({
  providers: [SalEsesService],
  controllers: [SalEsesController],
})
export class SalEsesModule {}
