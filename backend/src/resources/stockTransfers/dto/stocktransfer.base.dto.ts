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

export class StocktransferBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  transferNumber!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  productName!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  fromSectorId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fromSectorName!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  toSectorId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  toSectorName!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  transferDate!: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes!: string;
}
