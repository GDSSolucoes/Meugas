import { Module } from '@nestjs/common'
import { SectormastersService } from './sectorMasters.service'
import { SectormastersController } from './sectorMasters.controller'

@Module({
  providers: [SectormastersService],
  controllers: [SectormastersController],
})
export class SectormastersModule {}
