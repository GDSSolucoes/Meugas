import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID } from 'class-validator'
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { ContasAPagarStatusEnum } from '../../../database/schemas'

export class ContasapagarBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsOptional()
  @IsUUID()
  supplierId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  supplierName!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description!: string

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Date)
  dueDate!: Date

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  installmentNumber!: number

  @ApiProperty()
  @IsOptional()
  status!: ContasAPagarStatusEnum

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  paymentTypeId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentTypeName!: string

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  paymentDate!: Date

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  purchaseId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfeNumber!: string

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  groupId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  groupName!: string

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  subgroupId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  subgroupName!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  documentNumber!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  reagendamentoMotivo!: string

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  reagendamentoData!: Date
}
