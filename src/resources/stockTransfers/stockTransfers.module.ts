import { Module } from '@nestjs/common'
import { StocktransfersService } from './stockTransfers.service'
import { StocktransfersController } from './stockTransfers.controller'

@Module({
  providers: [StocktransfersService],
  controllers: [StocktransfersController],
})
export class StocktransfersModule {}
