import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger'
import { BaseCrudController } from '../../common/base-crud.controller'
import { EmployeEsesService } from './employees.service'
import { employees } from '../../database/schemas'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { EmployeEsCreateDto } from './dto/employees.post.dto'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { EmployeEsUpdateDto } from './dto/employees.update.dto'

@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'user')
@Controller('employees')
export class EmployeEsesController extends BaseCrudController<typeof employees> {
  constructor(protected readonly service: EmployeEsesService) {
    super(service, 'employees', true)
  }

  @Post()
  @ApiBody({ type: EmployeEsCreateDto })
  @ApiOperation({ summary: `Create EmployeEs` })
  @ApiResponse({ status: 201, description: `EmployeEs created`, type: EmployeEsCreateDto })
  async create(@Body() data: EmployeEsCreateDto) {
    return super.create(data)
  }

  @Get(':id')
  @ApiOperation({ summary: `Get EmployeEs by ID` })
  @ApiResponse({ status: 200, description: `EmployeEs retrieved`, type: EmployeEsCreateDto })
  async get(@Param('id') id: string) {
    return super.get(id)
  }

  @Get()
  @ApiOperation({ summary: `List EmployeEses` })
  @ApiResponse({ status: 200, description: `List of employees`, type: [EmployeEsCreateDto] })
  @ApiQuery({ name: 'page', required: false, type: 'string', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'string', description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'q', required: false, type: 'string', description: 'Search query' })
  async list() {
    return super.list()
  }

  @Put(':id')
  @ApiBody({ type: EmployeEsUpdateDto })
  @ApiOperation({ summary: `Update EmployeEs` })
  @ApiResponse({ status: 201, description: `EmployeEs updated`, type: EmployeEsUpdateDto })
  async update(@Param('id') id: string, @Body() data: EmployeEsUpdateDto) {
    return super.update(id, data)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: `Delete EmployeEs` })
  @ApiResponse({ status: 200, description: `EmployeEs deleted` })
  async delete(@Param('id') id: string) {
    return super.delete(id)
  }
}
