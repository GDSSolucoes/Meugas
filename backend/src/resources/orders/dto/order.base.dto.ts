import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { BaseGetDto } from "../../../common/dto/base-get.dto";
import {
  OrderItemsItem,
  OrderPersonAddress,
  OrdersStatusEnum,
} from "../../../database/schemas";
import { Type } from "class-transformer";

export class OrderBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  orderNumber!: string;

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
  personAddress!: OrderPersonAddress;

  @ApiProperty()
  @IsOptional()
  @IsString()
  employeeId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  employeeName!: string;

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
  cashAccountId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  cashAccountName!: string;

  @ApiProperty()
  @IsOptional()
  status!: OrdersStatusEnum;

  @ApiProperty()
  @IsOptional()
  items!: OrderItemsItem[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  totalAmount!: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  deliveryDate!: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes!: string;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  attendedAt!: Date;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  finalizedAt!: Date;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  cancelledAt!: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  cancellationReason!: string;

  @ApiProperty()
  @IsOptional()
  onDelete!: any;
}
