import { CashmovementBaseDto } from './cashmovement.base.dto'            
import { CashMovementTypeEnum } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class CashmovementCreateDto extends CashmovementBaseDto {
}
