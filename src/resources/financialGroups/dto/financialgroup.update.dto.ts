import { PartialType } from '@nestjs/swagger'
import { FinancialgroupCreateDto } from './financialgroup.post.dto'

export class FinancialgroupUpdateDto extends PartialType(FinancialgroupCreateDto) {}
