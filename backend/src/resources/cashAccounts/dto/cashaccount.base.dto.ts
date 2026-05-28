import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { CashAccountTypeEnum } from "../../../database/schemas";

export class CashaccountBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: CashAccountTypeEnum })
  @IsNotEmpty()
  type!: CashAccountTypeEnum;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  balance!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  initialBalance!: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  initialBalanceDate!: Date;
}
