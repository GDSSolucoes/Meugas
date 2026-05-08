import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger'
import { BaseCrudController } from '../../common/base-crud.controller'
import { ContasapagarsService } from './contasAPagar.service'
import { contasAPagar } from '../../database/schemas'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { ContasapagarCreateDto } from './dto/contasapagar.post.dto'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { ContasapagarUpdateDto } from './dto/contasapagar.update.dto'

@ApiTags('contasAPagar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'user')
@Controller('contasAPagar')
export class ContasapagarsController extends BaseCrudController<typeof contasAPagar> {
  constructor(protected readonly service: ContasapagarsService) {
    super(service, 'contasAPagar', true)
  }

  @Post()
  @ApiBody({ type: ContasapagarCreateDto })
  @ApiOperation({ summary: `Create Contasapagar` })
  @ApiResponse({ status: 201, description: `Contasapagar created`, type: ContasapagarCreateDto })
  async create(@Body() data: ContasapagarCreateDto) {
    return super.create(data)
  }

  @Get(':id')
  @ApiOperation({ summary: `Get Contasapagar by ID` })
  @ApiResponse({ status: 200, description: `Contasapagar retrieved`, type: ContasapagarCreateDto })
  async get(@Param('id') id: string) {
    return super.get(id)
  }

  @Get()
  @ApiOperation({ summary: `List Contasapagars` })
  @ApiResponse({ status: 200, description: `List of contasAPagar`, type: [ContasapagarCreateDto] })
  @ApiQuery({ name: 'page', required: false, type: 'string', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'string', description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'q', required: false, type: 'string', description: 'Search query' })
  async list() {
    return super.list()
  }

  @Put(':id')
  @ApiBody({ type: ContasapagarUpdateDto })
  @ApiOperation({ summary: `Update Contasapagar` })
  @ApiResponse({ status: 201, description: `Contasapagar updated`, type: ContasapagarUpdateDto })
  async update(@Param('id') id: string, @Body() data: ContasapagarUpdateDto) {
    return super.update(id, data)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: `Delete Contasapagar` })
  @ApiResponse({ status: 200, description: `Contasapagar deleted` })
  async delete(@Param('id') id: string) {
    return super.delete(id)
  }
}
