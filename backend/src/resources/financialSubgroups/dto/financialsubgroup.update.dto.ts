import { PartialType } from '@nestjs/swagger'
import { FinancialsubgroupCreateDto } from './financialsubgroup.post.dto'

export class FinancialsubgroupUpdateDto extends PartialType(FinancialsubgroupCreateDto) {}
