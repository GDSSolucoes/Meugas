import { Module } from '@nestjs/common'
import { ContasapagarsService } from './contasAPagar.service'
import { ContasapagarsController } from './contasAPagar.controller'

@Module({
  providers: [ContasapagarsService],
  controllers: [ContasapagarsController],
})
export class ContasapagarsModule {}
