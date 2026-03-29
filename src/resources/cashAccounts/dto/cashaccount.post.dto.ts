import { CashaccountBaseDto } from './cashaccount.base.dto'            
import { CashAccountTypeEnum } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class CashaccountCreateDto extends CashaccountBaseDto {
}
