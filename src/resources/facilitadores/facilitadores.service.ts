import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { facilitadores } from '../../database/schemas'
import { FacilitadorEsCreateDto } from './dto/facilitadores.post.dto'
import { FacilitadorEsUpdateDto } from './dto/facilitadores.update.dto'

@Injectable()
export class FacilitadorEsesService extends BaseCrudService<typeof facilitadores> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, facilitadores, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: FacilitadorEsCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<FacilitadorEsUpdateDto>) {
    return super.update(id, data)
  }
}
