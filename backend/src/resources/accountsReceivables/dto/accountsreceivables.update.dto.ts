import { PartialType } from "@nestjs/swagger";
import { AccountsReceivablesCreateDto } from "./accountsreceivables.post.dto";

export class AccountsReceivablesUpdateDto extends PartialType(
  AccountsReceivablesCreateDto,
) {}
