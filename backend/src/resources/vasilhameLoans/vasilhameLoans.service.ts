import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { vasilhameLoans } from '../../database/schemas'
import { VasilhameloanCreateDto } from './dto/vasilhameloan.post.dto'
import { VasilhameloanUpdateDto } from './dto/vasilhameloan.update.dto'

@Injectable()
export class VasilhameloansService extends BaseCrudService<typeof vasilhameLoans> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, vasilhameLoans, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: VasilhameloanCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<VasilhameloanUpdateDto>) {
    return super.update(id, data)
  }
}
