import { PersonBaseDto } from './person.base.dto'            
import { PersonTypeEnum, PersonAddress } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class PersonCreateDto extends PersonBaseDto {
}
