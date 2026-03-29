import { FinancialgroupBaseDto } from './financialgroup.base.dto'            
import { FinancialGroupTypeEnum } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class FinancialgroupCreateDto extends FinancialgroupBaseDto {
}
