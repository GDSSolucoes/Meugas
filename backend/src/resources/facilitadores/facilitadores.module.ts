import { Module } from '@nestjs/common'
import { FacilitadorEsesService } from './facilitadores.service'
import { FacilitadorEsesController } from './facilitadores.controller'

@Module({
  providers: [FacilitadorEsesService],
  controllers: [FacilitadorEsesController],
})
export class FacilitadorEsesModule {}
