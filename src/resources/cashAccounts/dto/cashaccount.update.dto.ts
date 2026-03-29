import { PartialType } from '@nestjs/swagger'
import { CashaccountCreateDto } from './cashaccount.post.dto'

export class CashaccountUpdateDto extends PartialType(CashaccountCreateDto) {}
