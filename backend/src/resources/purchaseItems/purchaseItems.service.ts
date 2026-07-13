import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { purchaseItems } from '../../database/schemas'
import { PurchaseitemCreateDto } from './dto/purchaseitem.post.dto'
import { PurchaseitemUpdateDto } from './dto/purchaseitem.update.dto'

@Injectable()
export class PurchaseitemsService extends BaseCrudService<typeof purchaseItems> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, purchaseItems, true)
  }

  async create(data: PurchaseitemCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<PurchaseitemUpdateDto>) {
    return super.update(id, data)
  }
}
