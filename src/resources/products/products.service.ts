import { Inject, Injectable } from '@nestjs/common'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { products } from '../../database/schemas'
import { and, eq, ilike } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { ProductsPostDto } from './dto/products.post.dto'
import { ProductsUpdateDto } from './dto/products.update.dto'

@Injectable()
export class ProductsService {
  constructor(@Inject('DB') private readonly db: NodePgDatabase) {}

  async list(companyId: number, q?: string) {
    const db = this.db
    const where = q
      ? and(eq(products.companyId, companyId), ilike(products.name, `%${q}%`))
      : eq(products.companyId, companyId)
    return db.select().from(products).where(where)
  }

  async get(companyId: number, id: string) {
    const db = this.db
    const rows = await db.select().from(products).where(and(eq(products.companyId, companyId), eq(products.id, id)))
    return rows[0] || null
  }

  async create(companyId: number, data: ProductsPostDto) {
    const db = this.db
    const id = uuidv4()
    await db.insert(products).values({
      id,
      companyId,
      ...data,
      unitPrice: (data.unitPrice as any) ?? null,
      costPrice: (data.costPrice as any) ?? null      
    })
    return this.get(companyId, id)
  }

  async update(companyId: number, id: string, data: Partial<ProductsUpdateDto>) {
    const db = this.db
    await db.update(products).set({
      ...data,
      unitPrice: (data.unitPrice as any) ?? undefined,
      costPrice: (data.costPrice as any) ?? undefined      
    }).where(and(eq(products.companyId, companyId), eq(products.id, id)))
    return this.get(companyId, id)
  }
}
