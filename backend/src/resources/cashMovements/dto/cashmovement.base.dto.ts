import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
} from "class-validator";
import { CashMovementTypeEnum } from "../../../database/schemas";
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";

export class CashmovementBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsOptional()
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
  relatedDocId!: string;
}
