import { PartialType } from '@nestjs/swagger'
import { StocktransferCreateDto } from './stocktransfer.post.dto'

export class StocktransferUpdateDto extends PartialType(StocktransferCreateDto) {}
