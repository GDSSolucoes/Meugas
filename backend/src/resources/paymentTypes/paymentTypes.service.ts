import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { paymentTypes } from '../../database/schemas'
import { PaymenttypEsCreateDto } from './dto/paymenttypes.post.dto'
import { PaymenttypEsUpdateDto } from './dto/paymenttypes.update.dto'

@Injectable()
export class PaymenttypEsesService extends BaseCrudService<typeof paymentTypes> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, paymentTypes, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: PaymenttypEsCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<PaymenttypEsUpdateDto>) {
    return super.update(id, data)
  }
}
