import { Injectable } from "@nestjs/common";
import { products } from "../../database/schemas";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";

@Injectable()
export class ProductsService extends BaseCrudService<typeof products> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, products, true); // hasCompanyId = true
  }
}
