import { Module, Global, Scope } from '@nestjs/common'
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { RlsService } from './rls/rls.service'
import { RequestContextService } from './request-context.service'
import { RlsInterceptor } from './rls/rls.interceptor'

@Global()
@Module({
  providers: [
    {
      provide: 'PG_POOL',
      useFactory: () => {
        const url = process.env.DATABASE_URL
        if (!url) throw new Error('DATABASE_URL not set')
        const needsSSL = /sslmode=require/i.test(url) || process.env.DATABASE_SSL === 'true' || process.env.PGSSL === 'require'
        const pool = new Pool({
          connectionString: url,
          max: 10,
          ssl: needsSSL ? { rejectUnauthorized: false } as any : undefined
        })
        return pool
      }
    },
    {
      provide: 'DB',
      scope: Scope.REQUEST,
      inject: [RequestContextService, 'PG_POOL'],
      useFactory: (ctx: RequestContextService, pool: Pool) => {
        const poolDb = drizzle(pool)
        // Proxy para garantir que qualquer chamada ao 'db' use o contexto atual (transacional se existir)
        // Isso resolve o problema de providers request-scoped instanciados antes do RLS ser ativado (ex: bootstrap-admin)
        return new Proxy(poolDb, {
          get(target, prop, receiver) {
            const currentDb = ctx.getDb() || poolDb
            const value = Reflect.get(currentDb, prop, receiver)
            return typeof value === 'function' ? value.bind(currentDb) : value
          }
        }) as NodePgDatabase
      }
    },
    RequestContextService,
    {
      provide: 'REQUEST_DB',
      scope: Scope.REQUEST,
      inject: ['DB'],
      useFactory: (db: any) => db
    },
    RlsService,
    RlsInterceptor
  ],
  exports: ['DB', 'REQUEST_DB', 'PG_POOL', RlsService, RequestContextService, RlsInterceptor]
})
export class DatabaseModule {}
