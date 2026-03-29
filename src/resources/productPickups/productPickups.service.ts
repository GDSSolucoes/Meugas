import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { productPickups } from '../../database/schemas'
import { ProductpickupCreateDto } from './dto/productpickup.post.dto'
import { ProductpickupUpdateDto } from './dto/productpickup.update.dto'

@Injectable()
export class ProductpickupsService extends BaseCrudService<typeof productPickups> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, productPickups, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: ProductpickupCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<ProductpickupUpdateDto>) {
    return super.update(id, data)
  }
}
