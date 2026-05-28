import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, ValidateNested } from 'class-validator'
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { BudgetItemsItemDto } from './budgetitemsitem.dto'
import { BudgetCustomerDataDto } from './budgetcustomerdata.dto'

export class BudgetBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  budgetNumber!: string

  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => BudgetCustomerDataDto)
  customerData!: BudgetCustomerDataDto

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BudgetItemsItemDto)
  items!: BudgetItemsItemDto[]

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  totalAmount!: number

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes!: string
}
