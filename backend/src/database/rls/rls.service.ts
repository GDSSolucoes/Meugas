import { Inject, Injectable } from '@nestjs/common'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { RequestContextService } from '../request-context.service'

@Injectable()
export class RlsService {
  constructor(@Inject('PG_POOL') private readonly pool: Pool, private readonly ctx: RequestContextService) {}

  async withCompany<T>(companyId: string, fn: (db: NodePgDatabase) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(`SELECT set_config('app.current_company_id', $1, true)`, [companyId])
      const db = drizzle(client)
      const result = await this.ctx.run({ client, db, companyId }, () => fn(db))
      await client.query('COMMIT')
      return result
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  }
}
