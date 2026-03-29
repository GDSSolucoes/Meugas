import { Module } from '@nestjs/common'
import { CashmovementsService } from './cashMovements.service'
import { CashmovementsController } from './cashMovements.controller'

@Module({
  providers: [CashmovementsService],
  controllers: [CashmovementsController],
})
export class CashmovementsModule {}
