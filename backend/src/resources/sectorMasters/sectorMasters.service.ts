import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { sectorMasters } from '../../database/schemas'
import { SectormasterCreateDto } from './dto/sectormaster.post.dto'
import { SectormasterUpdateDto } from './dto/sectormaster.update.dto'

@Injectable()
export class SectormastersService extends BaseCrudService<typeof sectorMasters> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, sectorMasters, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: SectormasterCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<SectormasterUpdateDto>) {
    return super.update(id, data)
  }
}
