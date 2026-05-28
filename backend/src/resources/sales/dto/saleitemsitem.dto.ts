import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber } from 'class-validator'

export class SaleItemsItemDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  productId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  productCode!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  productName!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  category!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  vasilhameId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  vasilhameName!: string

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  quantity!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  unitPrice!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  discount!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  total!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  quantityToPickup!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  vasilhameLoanQuantity!: number

}
