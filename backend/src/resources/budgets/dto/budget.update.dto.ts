import { PartialType } from '@nestjs/swagger'
import { BudgetCreateDto } from './budget.post.dto'

export class BudgetUpdateDto extends PartialType(BudgetCreateDto) {}
