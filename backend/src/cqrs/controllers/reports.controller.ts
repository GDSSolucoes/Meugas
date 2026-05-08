import { Controller, Get, UseGuards } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { CurrentUser } from '../../auth/current-user.decorator'
import { GetOrdersReportQuery } from '../queries/get-orders-report.query'

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('orders-daily')
  @ApiOperation({ summary: 'Get daily orders report for last 30 days' })
  @ApiResponse({ status: 200, description: 'Daily orders count' })
  async getOrdersReport(@CurrentUser() user: any) {
    return this.queryBus.execute(new GetOrdersReportQuery(user.companyId))
  }
}