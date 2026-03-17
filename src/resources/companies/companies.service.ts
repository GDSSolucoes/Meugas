import { Inject, Injectable } from '@nestjs/common'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { companies } from '../../database/schemas'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { CompanyPostDto } from './dto/company.post.dto'
import { CompanyUpdateDto } from './dto/company.update.dto'

@Injectable()
export class CompaniesService {
  constructor(@Inject('DB') private readonly db: NodePgDatabase) {}

  async listByIds(ids: number[]) {
    const rows = await this.db.select().from(companies)
    return rows.filter(r => ids.includes(r.id))
  }

  async get(id: number) {
    const rows = await this.db.select().from(companies).where(eq(companies.id, id))
    return rows[0] || null
  }

  async update(id: number, data: Partial<CompanyUpdateDto>) {
    await this.db.update(companies).set({
      ...data
    }).where(eq(companies.id, id))
    return this.get(id)
  }

  async create(data: CompanyPostDto) {
    const rows = await this.db.insert(companies).values({
      ...data
    }).returning()
    return rows[0]
  }
}
