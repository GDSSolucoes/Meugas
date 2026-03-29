import { OrderBaseDto } from './order.base.dto'            
import { OrderItemsItem, OrderPersonAddress, OrdersStatusEnum } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class OrderCreateDto extends OrderBaseDto {
}
