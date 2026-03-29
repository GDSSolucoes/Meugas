import { ContasapagarBaseDto } from './contasapagar.base.dto'            
import { ContasAPagarStatusEnum } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class ContasapagarCreateDto extends ContasapagarBaseDto {
}
