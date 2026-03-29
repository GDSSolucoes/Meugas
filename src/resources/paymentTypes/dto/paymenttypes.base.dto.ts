import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'
import { PaymentTypesTypeEnum } from '../../../database/schemas'

export class PaymenttypEsBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string

  @ApiProperty()
  @IsNotEmpty()
  type!: PaymentTypesTypeEnum

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  maxInstallments!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  daysInterval!: number

  @ApiProperty()
  @IsOptional()
  onDelete!: any

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  active!: boolean
}
