import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { CashMovementTypeEnum } from "../../../database/schemas";

export class CashmovementBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cashAccountId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  cashAccountName!: string;

  @ApiProperty({ enum: CashMovementTypeEnum })
  @IsNotEmpty()
  type!: CashMovementTypeEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  movementDate!: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  personId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  personName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  groupId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  groupName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  subgroupId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  subgroupName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  documentNumber!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  competenceMonth!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentTypeId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentTypeName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes!: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isAccounting!: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  relatedDocId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorName!: string;
}
