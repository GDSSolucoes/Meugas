import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { BaseGetDto } from "../../../common/dto/base-get.dto";
import { Type } from "class-transformer";

export class StocktransferBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  productName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fromSectorName!: string;

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
}
