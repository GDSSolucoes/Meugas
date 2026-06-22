import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, IsArray } from "class-validator";
import { PaymentTypesTypeEnum } from "../../../database/schemas";
import { SaleInstallmentsDetailsDto } from "./saleinstalmentdetailsitem.dto";

export class SalePaymentMethodsItemDto {
  @ApiProperty()
  @IsString()
  paymentTypeId!: string;

  @ApiProperty()
  @IsString()
  paymentTypeName!: string;

  @ApiProperty({ enum: PaymentTypesTypeEnum })
  paymentTypeType!: string;

  @ApiProperty()
  @IsNumber()
  amount!: number;

  @ApiProperty()
  @IsNumber()
  installments!: number;

  @ApiProperty()
  @IsString()
  cashAccountId!: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  installmentsDetails!: SaleInstallmentsDetailsDto[];
}
