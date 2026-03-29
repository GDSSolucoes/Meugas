import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { financialGroups } from '../../database/schemas'
import { FinancialgroupCreateDto } from './dto/financialgroup.post.dto'
import { FinancialgroupUpdateDto } from './dto/financialgroup.update.dto'

@Injectable()
export class FinancialgroupsService extends BaseCrudService<typeof financialGroups> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, financialGroups, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: FinancialgroupCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<FinancialgroupUpdateDto>) {
    return super.update(id, data)
  }
}
