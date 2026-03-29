import { Module } from '@nestjs/common'
import { FinancialgroupsService } from './financialGroups.service'
import { FinancialgroupsController } from './financialGroups.controller'

@Module({
  providers: [FinancialgroupsService],
  controllers: [FinancialgroupsController],
})
export class FinancialgroupsModule {}
