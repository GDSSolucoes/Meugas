import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { budgets } from '../../database/schemas'
import { BudgetCreateDto } from './dto/budget.post.dto'
import { BudgetUpdateDto } from './dto/budget.update.dto'

@Injectable()
export class BudgetsService extends BaseCrudService<typeof budgets> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, budgets, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: BudgetCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<BudgetUpdateDto>) {
    return super.update(id, data)
  }
}
