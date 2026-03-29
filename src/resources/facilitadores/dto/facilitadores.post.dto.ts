import { FacilitadorEsBaseDto } from './facilitadores.base.dto'            
import { FacilitadorTipoOperacaoEnum, FacilitadorRegimeTributarioEnum } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class FacilitadorEsCreateDto extends FacilitadorEsBaseDto {
}
