import { PartialType } from '@nestjs/swagger'
import { AccountsreceivablEsCreateDto } from './accountsreceivables.post.dto'

export class AccountsreceivablEsUpdateDto extends PartialType(AccountsreceivablEsCreateDto) {}
