import { Injectable } from "@nestjs/common";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import { sales } from "../../database/schemas";
import { SalesCreateDto } from "./dto/sales.post.dto";
import { SalesUpdateDto } from "./dto/sales.update.dto";

@Injectable()
export class SalesService extends BaseCrudService<typeof sales> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, sales, true); // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: SalesCreateDto) {
    return super.create(data);
  }

  async update(id: string, data: Partial<SalesUpdateDto>) {
    return super.update(id, data);
  }
}
