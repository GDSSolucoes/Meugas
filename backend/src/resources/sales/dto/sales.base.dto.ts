import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { SaleItemsItemDto } from "./saleitemsitem.dto";
import { SalePaymentMethodsItemDto } from "./salepaymentmethodsitem.dto";
import { SaleStatusEnum } from "../../../database/schemas";

export class SalesBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  saleNumber!: string;

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
  sectorId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorName!: string;

  @ApiProperty({ enum: SaleStatusEnum })
  @IsOptional()
  status!: SaleStatusEnum;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Date)
  saleDate!: Date;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemsItemDto)
  items!: SaleItemsItemDto[];

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalePaymentMethodsItemDto)
  paymentMethods!: SalePaymentMethodsItemDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalAmount!: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  orderId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  orderNumber!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  conveniadaId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  conveniadaName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfeNumber!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfeKey!: string;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  nfeDate!: Date;
  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  nfeCancelada!: boolean;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  nfeDataCancelamento!: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfeJustificativaCancelamento!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfceNumber!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfceKey!: string;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  nfceDate!: Date;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  nfceCancelada!: boolean;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  nfceDataCancelamento!: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  nfceJustificativaCancelamento!: string;
}
