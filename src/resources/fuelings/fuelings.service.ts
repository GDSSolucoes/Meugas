import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { fuelings } from '../../database/schemas'
import { FuelingCreateDto } from './dto/fueling.post.dto'
import { FuelingUpdateDto } from './dto/fueling.update.dto'

@Injectable()
export class FuelingsService extends BaseCrudService<typeof fuelings> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, fuelings, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: FuelingCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<FuelingUpdateDto>) {
    return super.update(id, data)
  }
}
