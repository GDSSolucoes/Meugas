import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { PurchaseItemsItemDto } from "./purchaseitemsitem.dto";

export class InstallmentDetailDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  number?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  status?: string;
}

export class PurchasEsBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  supplierId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  supplierName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  invoiceNumber!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfeNumber?: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  sectorId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorName!: string;

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  cashAccountId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  cashAccountName?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemsItemDto)
  items!: PurchaseItemsItemDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalAmount!: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  purchaseDate!: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentTypeId?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  paymentTypeName?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  installments?: number;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InstallmentDetailDto)
  installmentsDetails?: InstallmentDetailDto[];
}
