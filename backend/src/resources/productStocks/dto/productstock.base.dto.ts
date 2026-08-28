import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Transform, Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { parseDateOnly } from "../../../database/schemas/date-only";

export class ProductstockBaseDto extends BaseCreateDto {
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
  @IsString()
  sectorId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorName!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
  initialDate!: Date;
}
