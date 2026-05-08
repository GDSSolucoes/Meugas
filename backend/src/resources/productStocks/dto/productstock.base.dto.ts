import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDate,
} from "class-validator";
import { BaseGetDto } from "../../../common/dto/base-get.dto";

export class ProductstockBaseDto extends BaseGetDto {
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
  @Type(() => Date)
  @IsDate()
  initialDate!: Date;

  @ApiProperty()
  @IsOptional()
  onDelete!: any;
}
