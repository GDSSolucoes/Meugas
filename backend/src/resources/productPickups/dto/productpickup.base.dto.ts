import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Transform, Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { ProductPickupStatusEnum } from "../../../database/schemas";
import { parseDateOnly } from "../../../database/schemas/date-only";

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
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
  collectedDate!: Date;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
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
