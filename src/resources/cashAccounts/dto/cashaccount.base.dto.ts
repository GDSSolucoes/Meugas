import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'
import { CashAccountTypeEnum } from '../../../database/schemas'

export class CashaccountBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string

  @ApiProperty()
  @IsNotEmpty()
  type!: CashAccountTypeEnum

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  balance!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  initialBalance!: number

  @ApiProperty()
  @IsOptional()
  initialBalanceDate!: Date

  @ApiProperty()
  @IsOptional()
  onDelete!: any

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  active!: boolean
}
