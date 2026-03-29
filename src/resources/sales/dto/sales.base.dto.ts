import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'
import { SaleItemsItem, SaleStatusEnum, SalePaymentMethodsItem } from '../../../database/schemas'

export class SalEsBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  saleNumber!: string

  @ApiProperty()
  @IsOptional()
  onDelete!: any

  @ApiProperty()
  @IsOptional()
  @IsString()
  personName!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorName!: string

  @ApiProperty()
  @IsOptional()
  status!: SaleStatusEnum

  @ApiProperty()
  @IsOptional()
  saleDate!: Date

  @ApiProperty()
  @IsOptional()
  items!: SaleItemsItem[]

  @ApiProperty()
  @IsOptional()
  paymentMethods!: SalePaymentMethodsItem[]

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalAmount!: number

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  orderNumber!: string

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
  @IsString()
  nfeNumber!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfeKey!: string

  @ApiProperty()
  @IsOptional()
  nfeDate!: Date

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  nfeCancelada!: boolean

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfeJustificativaCancelamento!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfceNumber!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfceKey!: string

  @ApiProperty()
  @IsOptional()
  nfceDate!: Date

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  nfceCancelada!: boolean

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfceJustificativaCancelamento!: string
}
