import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { ProductstockmovementBaseDto } from './productstockmovement.base.dto'

export class ProductstockmovementCreateDto extends ProductstockmovementBaseDto {
  @ApiProperty()
  @IsUUID()
  productId!: string

  @ApiProperty()
  @IsUUID()
  sectorId!: string

  @ApiProperty()
  @IsString()
  type!: string

  @ApiProperty()
  @IsNumber()
  quantity!: number

  @ApiProperty()
  @IsDateString()
  movementDate!: string
}
