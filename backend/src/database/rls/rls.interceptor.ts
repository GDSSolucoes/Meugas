import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Inject,
} from "@nestjs/common";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { RequestContextService } from "../request-context.service";
import { from } from "rxjs";

@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(
    @Inject("PG_POOL") private readonly pool: Pool,
    private readonly ctx: RequestContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const companyId = req?.user?.companyId;
    if (!companyId) {
      return next.handle();
    }
    return from(this.execute(companyId, next));
  }

  private async execute(companyId: string, next: CallHandler) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(
        `SELECT set_config('app.current_company_id', $1, true)`,
        [companyId],
      );
      const db = drizzle(client);
      const result = await this.ctx.run({ client, db, companyId }, async () => {
        return await next.handle().toPromise();
      });
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}
