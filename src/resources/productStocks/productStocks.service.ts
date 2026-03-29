import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { productStocks } from '../../database/schemas'
import { ProductstockCreateDto } from './dto/productstock.post.dto'
import { ProductstockUpdateDto } from './dto/productstock.update.dto'

@Injectable()
export class ProductstocksService extends BaseCrudService<typeof productStocks> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, productStocks, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: ProductstockCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<ProductstockUpdateDto>) {
    return super.update(id, data)
  }
}
