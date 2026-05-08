import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { persons } from '../../database/schemas'
import { PersonCreateDto } from './dto/person.post.dto'
import { PersonUpdateDto } from './dto/person.update.dto'

@Injectable()
export class PersonsService extends BaseCrudService<typeof persons> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, persons, true) // hasCompanyId = true
  }

  // Override if needed for custom logic
  async create(data: PersonCreateDto) {
    return super.create(data)
  }

  async update(id: string, data: Partial<PersonUpdateDto>) {
    return super.update(id, data)
  }
}
