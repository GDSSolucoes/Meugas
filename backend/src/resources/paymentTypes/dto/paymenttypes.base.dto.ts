import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { PaymentTypesTypeEnum } from "../../../database/schemas";

export class PaymenttypEsBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNotEmpty()
  type!: PaymentTypesTypeEnum;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  maxInstallments!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  daysInterval!: number;
}
