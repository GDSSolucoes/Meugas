import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Transform, Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { ContasAPagarStatusEnum } from "../../../database/schemas";
import { parseDateOnly } from "../../../database/schemas/date-only";

export class ContasapagarBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  supplierId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  supplierName!: string;

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
  @IsOptional()
  @IsNumber()
  installmentNumber!: number;

  @ApiProperty()
  @IsOptional()
  status!: ContasAPagarStatusEnum;

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
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
  paymentDate!: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  purchaseId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfeNumber!: string;

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
  reagendamentoMotivo!: string;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
  reagendamentoData!: Date;
}
