import { Injectable } from "@nestjs/common";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import { vehicles } from "../../database/schemas";
import { VehiclesCreateDto } from "./dto/vehicles.post.dto";
import { VehiclesUpdateDto } from "./dto/vehicles.update.dto";

@Injectable()
export class VehiclesService extends BaseCrudService<typeof vehicles> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, vehicles, true); // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: VehiclesCreateDto) {
    return super.create(data);
  }

  async update(id: string, data: Partial<VehiclesUpdateDto>) {
    return super.update(id, data);
  }
}
