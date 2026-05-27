import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { BaseGetDto } from "../../../common/dto/base-get.dto";
import { SaleStatusEnum } from "../../../database/schemas";

class SaleInstallmentDetailDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  number!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  dueDate!: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  amount!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status!: string;
}

class SalePaymentMethodDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  paymentTypeId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  paymentTypeName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  amount!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  installments!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cashAccountId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleInstallmentDetailDto)
  installmentsDetails!: SaleInstallmentDetailDto[];
}

class SaleItemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productCode!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vasilhameId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vasilhameName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  quantity!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  unitPrice!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  discount!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  total!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  quantityToPickup!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  vasilhameLoanQuantity!: number;
}

export class SalEsBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  saleNumber!: string;

  @ApiProperty()
  @IsOptional()
  onDelete!: any;

  @ApiProperty()
  @IsOptional()
  @IsString()
  personName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  personId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorName!: string;

  @ApiProperty()
  @IsOptional()
  status!: SaleStatusEnum;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => Date)
  saleDate!: Date;

  @ApiProperty({ type: [SaleItemDto] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];

  @ApiProperty({ type: [SalePaymentMethodDto] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalePaymentMethodDto)
  paymentMethods!: SalePaymentMethodDto[];

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
  withTimezone!: any;

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
