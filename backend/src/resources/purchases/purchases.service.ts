import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { purchases } from '../../database/schemas'
import { PurchasEsCreateDto } from './dto/purchases.post.dto'
import { PurchasEsUpdateDto } from './dto/purchases.update.dto'

@Injectable()
export class PurchasEsesService extends BaseCrudService<typeof purchases> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, purchases, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: PurchasEsCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<PurchasEsUpdateDto>) {
    return super.update(id, data)
  }
}
