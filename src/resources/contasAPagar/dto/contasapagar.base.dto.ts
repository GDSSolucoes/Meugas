import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { BaseGetDto } from "../../../common/dto/base-get.dto";
import { ContasAPagarStatusEnum } from "../../../database/schemas";
import { Type } from "class-transformer";

export class ContasapagarBaseDto extends BaseGetDto {
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
  @Type(() => Date)
  dueDate!: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount!: number;

  @ApiProperty()
  @IsOptional()
  status!: ContasAPagarStatusEnum;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  paymentDate!: Date;

  @ApiProperty()
  @IsOptional()
  onDelete!: any;
}
