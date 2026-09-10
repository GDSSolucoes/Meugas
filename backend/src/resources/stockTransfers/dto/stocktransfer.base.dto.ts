import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
} from "class-validator";
import { Transform } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { parseDateOnly } from "../../../database/schemas/date-only";

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
  @IsPositive()
  quantity!: number;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
  transferDate!: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes!: string;
}
