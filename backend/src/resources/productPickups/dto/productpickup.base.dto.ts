import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { BaseGetDto } from "../../../common/dto/base-get.dto";
import { ProductPickupStatusEnum } from "../../../database/schemas";
import { Type } from "class-transformer";

export class ProductpickupBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  saleId!: string;

  @ApiProperty()
  @IsOptional()
  onDelete!: any;

  @ApiProperty()
  @IsOptional()
  @IsString()
  personName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  productName!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  pickupQuantity!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  collectedQuantity!: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  collectedDate!: Date;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  saleDate!: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notaFiscal!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  pedido!: string;

  @ApiProperty()
  @IsOptional()
  status!: ProductPickupStatusEnum;
}
