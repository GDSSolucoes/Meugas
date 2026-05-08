import { PartialType } from '@nestjs/swagger'
import { OrderCreateDto } from './order.post.dto'

export class OrderUpdateDto extends PartialType(OrderCreateDto) {}
