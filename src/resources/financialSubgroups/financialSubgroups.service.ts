import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { financialSubgroups } from '../../database/schemas'
import { FinancialsubgroupCreateDto } from './dto/financialsubgroup.post.dto'
import { FinancialsubgroupUpdateDto } from './dto/financialsubgroup.update.dto'

@Injectable()
export class FinancialsubgroupsService extends BaseCrudService<typeof financialSubgroups> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, financialSubgroups, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: FinancialsubgroupCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<FinancialsubgroupUpdateDto>) {
    return super.update(id, data)
  }
}
