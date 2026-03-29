import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { sectors } from '../../database/schemas'
import { SectorCreateDto } from './dto/sector.post.dto'
import { SectorUpdateDto } from './dto/sector.update.dto'

@Injectable()
export class SectorsService extends BaseCrudService<typeof sectors> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, sectors, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: SectorCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<SectorUpdateDto>) {
    return super.update(id, data)
  }
}
