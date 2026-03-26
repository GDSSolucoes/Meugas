import { Controller } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { BaseCrudController } from '../../common/base-crud.controller'
import { VehiclesService } from './vehicles.service'
import { vehicles } from '../../database/schemas'

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController extends BaseCrudController<typeof vehicles> {
  constructor(protected readonly service: VehiclesService) {
    super(service, 'vehicles', true)
  }
}