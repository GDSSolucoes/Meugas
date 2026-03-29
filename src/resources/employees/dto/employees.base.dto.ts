import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'
import { EmployeePositionEnum } from '../../../database/schemas'

export class EmployeEsBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  document!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  email!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  phone!: string

  @ApiProperty()
  @IsNotEmpty()
  position!: EmployeePositionEnum

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  salary!: number

  @ApiProperty()
  @IsOptional()
  hireDate!: Date

  @ApiProperty()
  @IsOptional()
  vacationStart!: Date

  @ApiProperty()
  @IsOptional()
  vacationEnd!: Date

  @ApiProperty()
  @IsOptional()
  onDelete!: any

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  active!: boolean
}
