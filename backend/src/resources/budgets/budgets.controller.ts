import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger'
import { BaseCrudController } from '../../common/base-crud.controller'
import { BudgetsService } from './budgets.service'
import { budgets } from '../../database/schemas'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { BudgetCreateDto } from './dto/budget.post.dto'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { BudgetUpdateDto } from './dto/budget.update.dto'
import { CurrentUser } from "../../auth/current-user.decorator"

@ApiTags('budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'user')
@Controller('budgets')
export class BudgetsController extends BaseCrudController<typeof budgets> {
  constructor(protected readonly service: BudgetsService) {
    super(service, 'budgets', true)
  }

  @Post()
  @ApiBody({ type: BudgetCreateDto })
  @ApiOperation({ summary: `Create Budget` })
  @ApiResponse({ status: 201, description: `Budget created`, type: BudgetCreateDto })
  async create(@Body() data: BudgetCreateDto, @CurrentUser() user?: any) {
    return super.create(data, user)
  }

  @Get(':id')
  @ApiOperation({ summary: `Get Budget by ID` })
  @ApiResponse({ status: 200, description: `Budget retrieved`, type: BudgetCreateDto })
  async get(@Param('id') id: string) {
    return super.get(id)
  }

  @Get()
  @ApiOperation({ summary: `List Budgets` })
  @ApiResponse({ status: 200, description: `List of budgets`, type: [BudgetCreateDto] })
  @ApiQuery({ name: 'page', required: false, type: 'string', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'string', description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'q', required: false, type: 'string', description: 'Search query' })
  @ApiQuery({ name: 'sort', required: false, type: 'string', description: 'Sort field' })
  @ApiQuery({ name: 'order', required: false, type: 'string', description: 'Sort order' })
  async list(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("q") search?: string,
    @Query("sort") sort?: string,
    @Query("order") order?: string,
    @Query() allFilters?: Record<string, any>
    ) {
    return super.list(page, limit, search, sort, order, allFilters)
  }

  @Put(':id')
  @ApiBody({ type: BudgetUpdateDto })
  @ApiOperation({ summary: `Update Budget` })
  @ApiResponse({ status: 201, description: `Budget updated`, type: BudgetUpdateDto })
  async update(@Param('id') id: string, @Body() data: BudgetUpdateDto) {
    return super.update(id, data)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: `Delete Budget` })
  @ApiResponse({ status: 200, description: `Budget deleted` })
  async delete(@Param('id') id: string) {
    return super.delete(id)
  }
}
