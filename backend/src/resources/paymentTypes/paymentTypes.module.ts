import { Module } from '@nestjs/common'
import { PaymenttypEsesService } from './paymentTypes.service'
import { PaymenttypEsesController } from './paymentTypes.controller'

@Module({
  providers: [PaymenttypEsesService],
  controllers: [PaymenttypEsesController],
})
export class PaymenttypEsesModule {}
