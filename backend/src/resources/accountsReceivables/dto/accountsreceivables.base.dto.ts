import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { AccountsReceivableStatusEnum } from "../../../database/schemas";
import { parseDateOnly } from "../../../database/schemas/date-only";

export class AccountsReceivablesBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  personId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  personName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  saleId!: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  paymentTypeId!: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  installmentNumber!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
  dueDate!: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount!: number;

  @ApiProperty()
  @IsNotEmpty()
  status!: AccountsReceivableStatusEnum;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
  paymentDate!: Date;
}
