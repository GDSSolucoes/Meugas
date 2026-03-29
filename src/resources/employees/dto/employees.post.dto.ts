import { EmployeEsBaseDto } from './employees.base.dto'            
import { EmployeePositionEnum } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class EmployeEsCreateDto extends EmployeEsBaseDto {
}
