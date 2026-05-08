import { PartialType } from '@nestjs/swagger'
import { PurchasEsCreateDto } from './purchases.post.dto'

export class PurchasEsUpdateDto extends PartialType(PurchasEsCreateDto) {}
