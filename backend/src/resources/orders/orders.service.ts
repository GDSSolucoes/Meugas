import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { orderItems, orders } from '../../database/schemas'
import { OrderCreateDto } from './dto/order.post.dto'
import { OrderUpdateDto } from './dto/order.update.dto'

@Injectable()
export class OrdersService extends BaseCrudService<typeof orders> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, orders, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: OrderCreateDto) {
    const savedOrder = await super.create(data)
    if (savedOrder?.id && data.items?.length) {
      await this.getDb().insert(orderItems).values(
        data.items.map((item) => ({
          orderId: savedOrder.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          total: item.total,
          companyId: savedOrder.companyId,
          companyName: savedOrder.companyName,
        })),
      )
    }

    return savedOrder
  }

  async update(id: string, data: Partial<OrderUpdateDto>) {
    const updatedOrder = await super.update(id, data)

    if (updatedOrder?.id && data.items !== undefined) {
      const db = this.getDb()
      await db.delete(orderItems).where(eq(orderItems.orderId, id))

      if (data.items.length > 0) {
        await db.insert(orderItems).values(
          data.items.map((item) => ({
            orderId: updatedOrder.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
            companyId: updatedOrder.companyId,
            companyName: updatedOrder.companyName,
          })),
        )
      }
    }

    return updatedOrder
  }
}
