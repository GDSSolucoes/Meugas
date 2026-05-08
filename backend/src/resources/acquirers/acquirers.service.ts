import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { acquirers } from '../../database/schemas'
import { AcquirerCreateDto } from './dto/acquirer.post.dto'
import { AcquirerUpdateDto } from './dto/acquirer.update.dto'

@Injectable()
export class AcquirersService extends BaseCrudService<typeof acquirers> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, acquirers, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: AcquirerCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<AcquirerUpdateDto>) {
    return super.update(id, data)
  }
}
