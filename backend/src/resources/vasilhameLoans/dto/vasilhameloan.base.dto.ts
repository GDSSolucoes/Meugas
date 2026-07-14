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
import { VasilhameLoanStatusEnum } from "../../../database/schemas";

export class VasilhameloanBaseDto extends BaseCreateDto {
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
  vasilhameId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  vasilhameName!: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  sectorId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorName?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  loanQuantity!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  returnedQuantity!: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  loanDate!: Date;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  returnDate?: Date;

  @ApiProperty({ enum: VasilhameLoanStatusEnum })
  @IsOptional()
  status!: VasilhameLoanStatusEnum;
}
