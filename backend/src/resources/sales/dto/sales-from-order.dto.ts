import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

class OrderSaleInstallmentDto {
  @IsNumber()
  @Min(1)
  number!: number;

  @IsDateString()
  dueDate!: string;

  @IsNumber()
  @Min(0)
  amount!: number;
}

class OrderSalePaymentDto {
  @IsUUID()
  paymentTypeId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsUUID()
  cashAccountId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderSaleInstallmentDto)
  installmentsDetails?: OrderSaleInstallmentDto[];
}

export class SalesFromOrderDto {
  @IsUUID()
  orderId!: string;

  @IsUUID()
  sectorId!: string;

  @IsNumber()
  @Min(0.01)
  totalAmount!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderSalePaymentDto)
  paymentMethods!: OrderSalePaymentDto[];
}
