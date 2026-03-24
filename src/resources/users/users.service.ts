import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { userRoleEnum, users, userTypeEnum } from '../../database/schemas'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import * as bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { UsersPostDto } from './dto/users.post.dto'
import { UsersUpdateDto } from './dto/users.update.dto'

@Injectable()
export class UsersService {
  constructor(@Inject('DB') private readonly db: NodePgDatabase) {}

  async findByEmail(email: string) {
    const rows = await this.db.select().from(users).where(eq(users.email, email))
    return rows[0] || null
  }

  async findByCpf(cpf: string) {
    const rows = await this.db.select().from(users).where(eq(users.cpf, cpf))
    return rows[0] || null
  }

  async validatePassword(hash: string, password: string) {
    return bcrypt.compare(password, hash)
  }

  async create(data: UsersPostDto) {
    const db = this.db
    const id = uuidv4()
    const passwordHash = await bcrypt.hash(data.password, 10)
    await db.insert(users).values({
      id,
      ...data,
      role: data.role || userRoleEnum.USER,
      user_type: data.user_type || userTypeEnum.ATENDENTE,
      passwordHash,
      active: true,
    })
    const rows = await db.select().from(users).where(eq(users.id, id))
    return rows[0]
  }

  async countAll() {
    const rows = await this.db.select({}).from(users)
    return rows.length
  }

  async listAll() {
    const db = this.db
    const rows = await db.select().from(users)
    return rows
  }

  async update(id: string, data: Partial<UsersUpdateDto>) {
    const db = this.db
    const patch: any = {      
      ...data
    }
    if (data.password) {
      patch.passwordHash = await bcrypt.hash(data.password, 10)
    }
    await db.update(users).set(patch).where(eq(users.id, id))
    const rows = await db.select().from(users).where(eq(users.id, id))
    return rows[0]
  }
}
