import { SalEsBaseDto } from './sales.base.dto'            
import { SaleItemsItem, SaleStatusEnum, SalePaymentMethodsItem } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class SalEsCreateDto extends SalEsBaseDto {
}
