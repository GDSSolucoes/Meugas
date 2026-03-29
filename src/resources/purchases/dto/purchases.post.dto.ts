import { PurchasEsBaseDto } from './purchases.base.dto'            
import { PurchaseItemsItem } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class PurchasEsCreateDto extends PurchasEsBaseDto {
}
