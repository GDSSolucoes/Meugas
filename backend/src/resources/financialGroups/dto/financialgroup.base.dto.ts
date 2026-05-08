import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'
import { FinancialGroupTypeEnum } from '../../../database/schemas'

export class FinancialgroupBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string

  @ApiProperty()
  @IsNotEmpty()
  type!: FinancialGroupTypeEnum

  @ApiProperty()
  @IsOptional()
  @IsString()
  description!: string

  @ApiProperty()
  @IsOptional()
  onDelete!: any

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  active!: boolean
}
