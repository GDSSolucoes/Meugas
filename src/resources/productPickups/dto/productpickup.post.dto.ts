import { ProductpickupBaseDto } from './productpickup.base.dto'            
import { ProductPickupStatusEnum } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class ProductpickupCreateDto extends ProductpickupBaseDto {
}
