import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { cashAccounts } from '../../database/schemas'
import { CashaccountCreateDto } from './dto/cashaccount.post.dto'
import { CashaccountUpdateDto } from './dto/cashaccount.update.dto'

@Injectable()
export class CashaccountsService extends BaseCrudService<typeof cashAccounts> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, cashAccounts, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: CashaccountCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<CashaccountUpdateDto>) {
    return super.update(id, data)
  }
}
