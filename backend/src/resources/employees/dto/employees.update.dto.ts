import { PartialType } from '@nestjs/swagger'
import { EmployeEsCreateDto } from './employees.post.dto'

export class EmployeEsUpdateDto extends PartialType(EmployeEsCreateDto) {}
