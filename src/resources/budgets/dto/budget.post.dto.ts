import { BudgetBaseDto } from './budget.base.dto'            
import { BudgetCustomerData, BudgetItemsItem } from '../../../database/schemas'
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'

export class BudgetCreateDto extends BudgetBaseDto {
}
