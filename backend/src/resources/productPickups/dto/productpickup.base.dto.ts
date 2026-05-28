import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { ProductPickupStatusEnum } from "../../../database/schemas";

export class ProductpickupBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  saleId!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  personId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  personName!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  productId!: string;

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

  @ApiProperty({ enum: ProductPickupStatusEnum })
  @IsOptional()
  status!: ProductPickupStatusEnum;
}
