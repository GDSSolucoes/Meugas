import { PaymenttypEsBaseDto } from './paymenttypes.base.dto'            
import { PaymentTypesTypeEnum } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class PaymenttypEsCreateDto extends PaymenttypEsBaseDto {
}
