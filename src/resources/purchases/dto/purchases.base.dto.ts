import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { BaseGetDto } from "../../../common/dto/base-get.dto";
import { PurchaseItemsItem } from "../../../database/schemas";
import { Type } from "class-transformer";

export class PurchasEsBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  supplierId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  supplierName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  invoiceNumber!: string;

  @ApiProperty()
  @IsOptional()
  items!: PurchaseItemsItem[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalAmount!: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  purchaseDate!: Date;

  @ApiProperty()
  @IsOptional()
  onDelete!: any;
}
