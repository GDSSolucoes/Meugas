import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { sql, eq, and, gte, lte } from 'drizzle-orm'
import { orders } from '../../database/schemas'
import { GetOrdersReportQuery } from '../queries/get-orders-report.query'

@QueryHandler(GetOrdersReportQuery)
export class GetOrdersReportHandler implements IQueryHandler<GetOrdersReportQuery> {
  constructor(@Inject('DB') private readonly db: NodePgDatabase) {}

  async execute(query: GetOrdersReportQuery) {
    const { companyId } = query

    // Last 30 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const result = await this.db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        total: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.companyId, companyId),
          eq(orders.active, true),
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`)

    return result
  }
}