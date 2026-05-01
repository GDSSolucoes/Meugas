import { Injectable } from '@nestjs/common'
import { companies } from '../../database/schemas'
import { eq } from 'drizzle-orm'
import { CompanyUpdateDto } from './dto/companies.update.dto'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'

@Injectable()
export class CompaniesService extends BaseCrudService<typeof companies> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, companies, true) // hasCompanyId = true
  }

  async listByIds(ids: string[]) {
    const rows = await this.getDb().select().from(companies)
    return rows.filter(r => ids.includes(r.id))
  }

  async get(id: string) {
    const rows = await this.getDb().select().from(companies).where(eq(companies.id, id))
    return rows[0] || null
  }
}
