import { AccountsReceivableStatusEnum } from "../../database/schemas";

export class FilterAccountsReceivableQuery {
  constructor(
    public readonly filters: {
      personId?: string;
      sectorId?: string;
      paymentTypeId?: string;
      status?: AccountsReceivableStatusEnum[];
      dueDate_gte?: string;
      dueDate_lte?: string;
      saleId?: string;
      id?: string;
      nfeNumber?: string;
      personDocument?: string;
    },
    public readonly options: {
      sort?: string;
      limit?: number;
    },
    public readonly companyId: string,
  ) {}
}
