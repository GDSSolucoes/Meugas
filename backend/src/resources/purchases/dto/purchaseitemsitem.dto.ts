import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber } from 'class-validator'

export class PurchaseItemsItemDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  productId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  productName!: string

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
  total!: number

}
