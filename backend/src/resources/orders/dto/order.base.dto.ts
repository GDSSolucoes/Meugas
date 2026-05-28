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
import { OrderItemsItemDto } from "./orderitemsitem.dto";
import { OrderPersonAddressDto } from "./orderpersonaddress.dto";
import { OrdersStatusEnum } from "../../../database/schemas";

export class OrderBaseDto extends BaseCreateDto {
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
  @ValidateNested()
  @Type(() => OrderPersonAddressDto)
  personAddress!: OrderPersonAddressDto;

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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemsItemDto)
  items!: OrderItemsItemDto[];

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
  @IsString()
  canal!: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  urgente!: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  convenio!: boolean;
}
