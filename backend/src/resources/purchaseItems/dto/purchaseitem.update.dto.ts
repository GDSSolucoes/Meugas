import { PartialType } from '@nestjs/swagger'
import { PurchaseitemBaseDto } from './purchaseitem.base.dto'

export class PurchaseitemUpdateDto extends PartialType(PurchaseitemBaseDto) {
}
