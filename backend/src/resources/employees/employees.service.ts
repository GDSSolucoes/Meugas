import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { employees } from '../../database/schemas'
import { EmployeEsCreateDto } from './dto/employees.post.dto'
import { EmployeEsUpdateDto } from './dto/employees.update.dto'

@Injectable()
export class EmployeEsesService extends BaseCrudService<typeof employees> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, employees, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: EmployeEsCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<EmployeEsUpdateDto>) {
    return super.update(id, data)
  }
}
