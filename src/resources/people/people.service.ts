import { Inject, Injectable } from '@nestjs/common'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { people } from '../../database/schemas'
import { and, eq, ilike } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { PeoplePostDto } from './dto/people.post.dto'
import { PeopleUpdateDto } from './dto/people.update.dto'

@Injectable()
export class PeopleService {
  constructor(@Inject('DB') private readonly db: NodePgDatabase) {}

  async list(companyId: number, q?: string) {
    const db = this.db
    const where = q
      ? and(eq(people.companyId, companyId), ilike(people.name, `%${q}%`))
      : eq(people.companyId, companyId)
    return db.select().from(people).where(where)
  }

  async get(companyId: number, id: string) {
    const db = this.db
    const rows = await db.select().from(people).where(and(eq(people.companyId, companyId), eq(people.id, id)))
    return rows[0] || null
  }

  async create(companyId: number, data: PeoplePostDto) {
    const db = this.db
    const id = uuidv4()
    await db.insert(people).values({
      id,
      companyId,
      ...data,
    })
    return this.get(companyId, id)
  }

  async update(companyId: number, id: string, data: Partial<PeopleUpdateDto>) {
    const db = this.db
    await db.update(people).set({
      ...data,
    }).where(and(eq(people.companyId, companyId), eq(people.id, id)))
    return this.get(companyId, id)
  }
}
