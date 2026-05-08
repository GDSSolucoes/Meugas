import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { vehicles } from '../../database/schemas'
import { VehicleCreateDto } from './dto/vehicle.post.dto'
import { VehicleUpdateDto } from './dto/vehicle.update.dto'

@Injectable()
export class VehiclesService extends BaseCrudService<typeof vehicles> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, vehicles, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: VehicleCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<VehicleUpdateDto>) {
    return super.update(id, data)
  }
}