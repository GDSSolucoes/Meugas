import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator'

export class SalePaymentMethodsItemDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentTypeId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentTypeName!: string

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  amount!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  installments!: number

  @ApiProperty()
  @IsOptional()
  @IsString()
  cashAccountId!: string

  @ApiProperty()
  @IsOptional()
  @IsArray()
  installmentsDetails!: any[]

}
