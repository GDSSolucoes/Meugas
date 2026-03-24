import { Injectable } from '@nestjs/common'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { PoolClient } from 'pg'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

type Ctx = {
  client: PoolClient
  db: NodePgDatabase
  companyId: string
}

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<Ctx>()

  run<T>(ctx: Ctx, fn: () => Promise<T>): Promise<T> {
    return this.als.run(ctx, fn)
  }

  getDb(): NodePgDatabase | undefined {
    const store = this.als.getStore()
    return store?.db
  }

  getCompanyId(): string | undefined {
    const store = this.als.getStore()
    return store?.companyId
  }
}
