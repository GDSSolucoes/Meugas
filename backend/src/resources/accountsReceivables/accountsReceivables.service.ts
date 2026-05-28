import { Injectable } from "@nestjs/common";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import { accountsReceivables } from "../../database/schemas";
import { AccountsReceivablesCreateDto } from "./dto/accountsreceivables.post.dto";
import { AccountsReceivablesUpdateDto } from "./dto/accountsreceivables.update.dto";

@Injectable()
export class AccountsReceivablesService extends BaseCrudService<
  typeof accountsReceivables
> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, accountsReceivables, true); // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: AccountsReceivablesCreateDto) {
    return super.create(data);
  }

  async update(id: string, data: Partial<AccountsReceivablesUpdateDto>) {
    return super.update(id, data);
  }
}
