import { VasilhameloanBaseDto } from './vasilhameloan.base.dto'            
import { VasilhameLoanStatusEnum } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class VasilhameloanCreateDto extends VasilhameloanBaseDto {
}
