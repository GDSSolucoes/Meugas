import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { cashMovements } from '../../database/schemas'
import { CashmovementCreateDto } from './dto/cashmovement.post.dto'
import { CashmovementUpdateDto } from './dto/cashmovement.update.dto'

@Injectable()
export class CashmovementsService extends BaseCrudService<typeof cashMovements> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, cashMovements, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: CashmovementCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<CashmovementUpdateDto>) {
    return super.update(id, data)
  }
}
