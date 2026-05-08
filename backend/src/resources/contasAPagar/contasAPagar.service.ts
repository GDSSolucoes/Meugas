import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { contasAPagar } from '../../database/schemas'
import { ContasapagarCreateDto } from './dto/contasapagar.post.dto'
import { ContasapagarUpdateDto } from './dto/contasapagar.update.dto'

@Injectable()
export class ContasapagarsService extends BaseCrudService<typeof contasAPagar> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, contasAPagar, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: ContasapagarCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<ContasapagarUpdateDto>) {
    return super.update(id, data)
  }
}
