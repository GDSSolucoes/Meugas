import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { FinancialGroupTypeEnum } from "../../../database/schemas";

export class FinancialgroupBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: FinancialGroupTypeEnum })
  @IsNotEmpty()
  type!: FinancialGroupTypeEnum;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description!: string;
}
