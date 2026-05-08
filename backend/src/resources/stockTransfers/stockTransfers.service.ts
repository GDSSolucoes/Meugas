import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { stockTransfers } from '../../database/schemas'
import { StocktransferCreateDto } from './dto/stocktransfer.post.dto'
import { StocktransferUpdateDto } from './dto/stocktransfer.update.dto'

@Injectable()
export class StocktransfersService extends BaseCrudService<typeof stockTransfers> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, stockTransfers, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: StocktransferCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<StocktransferUpdateDto>) {
    return super.update(id, data)
  }
}
