import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsUUID,
} from "class-validator";
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { BudgetItemsItemDto } from "./budgetitemsitem.dto";

export class BudgetBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  budgetNumber!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  personId!: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemsItemDto)
  items!: BudgetItemsItemDto[];

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  totalAmount!: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes!: string;
}
