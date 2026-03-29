import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'
import { PersonTypeEnum, PersonAddress } from '../../../database/schemas'

export class PersonBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsOptional()
  onDelete!: any

  @ApiProperty()
  @IsOptional()
  @IsString()
  personNumber!: string

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
  phone!: string[]

  @ApiProperty()
  @IsNotEmpty()
  type!: PersonTypeEnum

  @ApiProperty()
  @IsOptional()
  address!: PersonAddress

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  glpConsumptionDays!: number

  @ApiProperty()
  @IsOptional()
  birthday!: Date

  @ApiProperty()
  @IsOptional()
  @IsString()
  conveniadaId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  conveniadaName!: string

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  active!: boolean
}
