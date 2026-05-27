import { SalEsBaseDto } from './sales.base.dto'            
import { SaleItemsItem, SalePaymentMethodsItem, SaleStatusEnum } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'
import { Type } from "class-transformer";

export class SalEsCreateDto extends SalEsBaseDto {
}
