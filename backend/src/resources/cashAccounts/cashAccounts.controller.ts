import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger'
import { BaseCrudController } from '../../common/base-crud.controller'
import { CashaccountsService } from './cashAccounts.service'
import { cashAccounts } from '../../database/schemas'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { CashaccountCreateDto } from './dto/cashaccount.post.dto'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { CashaccountUpdateDto } from './dto/cashaccount.update.dto'

@ApiTags('cashAccounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'user')
@Controller('cashAccounts')
export class CashaccountsController extends BaseCrudController<typeof cashAccounts> {
  constructor(protected readonly service: CashaccountsService) {
    super(service, 'cashAccounts', true)
  }

  @Post()
  @ApiBody({ type: CashaccountCreateDto })
  @ApiOperation({ summary: `Create Cashaccount` })
  @ApiResponse({ status: 201, description: `Cashaccount created`, type: CashaccountCreateDto })
  async create(@Body() data: CashaccountCreateDto) {
    return super.create(data)
  }

  @Get(':id')
  @ApiOperation({ summary: `Get Cashaccount by ID` })
  @ApiResponse({ status: 200, description: `Cashaccount retrieved`, type: CashaccountCreateDto })
  async get(@Param('id') id: string) {
    return super.get(id)
  }

  @Get()
  @ApiOperation({ summary: `List Cashaccounts` })
  @ApiResponse({ status: 200, description: `List of cashAccounts`, type: [CashaccountCreateDto] })
  @ApiQuery({ name: 'page', required: false, type: 'string', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'string', description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'q', required: false, type: 'string', description: 'Search query' })
  async list() {
    return super.list()
  }

  @Put(':id')
  @ApiBody({ type: CashaccountUpdateDto })
  @ApiOperation({ summary: `Update Cashaccount` })
  @ApiResponse({ status: 201, description: `Cashaccount updated`, type: CashaccountUpdateDto })
  async update(@Param('id') id: string, @Body() data: CashaccountUpdateDto) {
    return super.update(id, data)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: `Delete Cashaccount` })
  @ApiResponse({ status: 200, description: `Cashaccount deleted` })
  async delete(@Param('id') id: string) {
    return super.delete(id)
  }
}
