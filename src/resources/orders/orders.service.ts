import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { orders } from '../../database/schemas'
import { OrderCreateDto } from './dto/order.post.dto'
import { OrderUpdateDto } from './dto/order.update.dto'

@Injectable()
export class OrdersService extends BaseCrudService<typeof orders> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, orders, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: OrderCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<OrderUpdateDto>) {
    return super.update(id, data)
  }
}
