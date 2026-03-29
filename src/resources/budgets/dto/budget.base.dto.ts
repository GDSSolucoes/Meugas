import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'
import { BudgetCustomerData, BudgetItemsItem } from '../../../database/schemas'

export class BudgetBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  budgetNumber!: string

  @ApiProperty()
  @IsOptional()
  customerData!: BudgetCustomerData

  @ApiProperty()
  @IsOptional()
  items!: BudgetItemsItem[]

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  totalAmount!: number

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes!: string

  @ApiProperty()
  @IsOptional()
  onDelete!: any
}
