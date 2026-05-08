import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { accountsReceivables } from '../../database/schemas'
import { AccountsreceivablEsCreateDto } from './dto/accountsreceivables.post.dto'
import { AccountsreceivablEsUpdateDto } from './dto/accountsreceivables.update.dto'

@Injectable()
export class AccountsreceivablEsesService extends BaseCrudService<typeof accountsReceivables> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, accountsReceivables, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: AccountsreceivablEsCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<AccountsreceivablEsUpdateDto>) {
    return super.update(id, data)
  }
}
