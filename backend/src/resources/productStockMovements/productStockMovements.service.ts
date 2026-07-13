import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { productStockMovements } from '../../database/schemas'
import { ProductstockmovementCreateDto } from './dto/productstockmovement.post.dto'
import { ProductstockmovementUpdateDto } from './dto/productstockmovement.update.dto'

@Injectable()
export class ProductstockmovementsService extends BaseCrudService<typeof productStockMovements> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, productStockMovements, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: ProductstockmovementCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<ProductstockmovementUpdateDto>) {
    return super.update(id, data)
  }
}
