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
  @IsUUID()
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
  @IsUUID()
  personId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  personName!: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  groupId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  groupName!: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
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
  @IsUUID()
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
  @IsUUID()
  relatedDocId!: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  sectorId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorName!: string;
}
