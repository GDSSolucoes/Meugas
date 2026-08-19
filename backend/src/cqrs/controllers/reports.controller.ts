import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { QueryBus } from '@nestjs/cqrs'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { CurrentUser } from '../../auth/current-user.decorator'
import { GetOrdersReportQuery } from '../queries/get-orders-report.query'
import { GetStockReportQuery } from '../queries/get-stock-report.query'

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

  @Post('stock-movement')
  @ApiOperation({ summary: 'Generate stock movement report by sector and date' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['sectorId', 'reportDate'],
      properties: {
        sectorId: {
          type: 'string',
          description: 'ID do setor (prefixado com "sector:") ou do setor master (prefixado com "master:")',
          example: 'sector:uuid-1234',
        },
        reportDate: {
          type: 'string',
          description: 'Data do relatório no formato yyyy-MM-dd',
          example: '2026-07-27',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Stock movement report data' })
  async getStockReport(
    @Body() data: { sectorId: string; reportDate: string },
    @CurrentUser() user: any,
  ) {
    return this.queryBus.execute(
      new GetStockReportQuery(data.sectorId, data.reportDate, user.companyId),
    )
  }
}