import { Inject, Injectable } from '@nestjs/common'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { persons } from '../../database/schemas'
import { and, eq, ilike } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { PeoplePostDto } from './dto/people.post.dto'
import { PeopleUpdateDto } from './dto/people.update.dto'

@Injectable()
export class PeopleService {
  constructor(@Inject('DB') private readonly db: NodePgDatabase) {}

  async list(companyId: string, q?: string) {
    const db = this.db
    const where = q
      ? and(eq(persons.companyId, companyId), ilike(persons.name, `%${q}%`))
      : eq(persons.companyId, companyId)
    return db.select().from(persons).where(where)
  }

  async get(companyId: string, id: string) {
    const db = this.db
    const rows = await db.select().from(persons).where(and(eq(persons.companyId, companyId), eq(persons.id, id)))
    return rows[0] || null
  }

  async create(companyId: string, data: PeoplePostDto) {
    const db = this.db
    var result = await db.insert(persons).values({
      companyId,
      ...data,
      birthday: data.birthday ? data.birthday.toISOString() : data.birthday,
    }).returning()
    return result;
  }

  async update(companyId: string, id: string, data: Partial<PeopleUpdateDto>) {
    const db = this.db
    var result = await db.update(persons).set({
      ...data,
      birthday: data.birthday ? data.birthday.toISOString() : data.birthday,
    }).where(and(eq(persons.companyId, companyId), eq(persons.id, id))).returning()
    return result;
  }
}
