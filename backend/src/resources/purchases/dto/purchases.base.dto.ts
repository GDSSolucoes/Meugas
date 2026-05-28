import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID, IsArray, ValidateNested } from 'class-validator'
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { PurchaseItemsItemDto } from './purchaseitemsitem.dto'

export class PurchasEsBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  supplierId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  supplierName!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  invoiceNumber!: string

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemsItemDto)
  items!: PurchaseItemsItemDto[]

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalAmount!: number

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  purchaseDate!: Date
}
