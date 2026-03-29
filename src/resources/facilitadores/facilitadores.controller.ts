import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger'
import { BaseCrudController } from '../../common/base-crud.controller'
import { FacilitadorEsesService } from './facilitadores.service'
import { facilitadores } from '../../database/schemas'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { FacilitadorEsCreateDto } from './dto/facilitadores.post.dto'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { FacilitadorEsUpdateDto } from './dto/facilitadores.update.dto'

@ApiTags('facilitadores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'user')
@Controller('facilitadores')
export class FacilitadorEsesController extends BaseCrudController<typeof facilitadores> {
  constructor(protected readonly service: FacilitadorEsesService) {
    super(service, 'facilitadores', true)
  }

  @Post()
  @ApiBody({ type: FacilitadorEsCreateDto })
  @ApiOperation({ summary: `Create FacilitadorEs` })
  @ApiResponse({ status: 201, description: `FacilitadorEs created`, type: FacilitadorEsCreateDto })
  async create(@Body() data: FacilitadorEsCreateDto) {
    return super.create(data)
  }

  @Get(':id')
  @ApiOperation({ summary: `Get FacilitadorEs by ID` })
  @ApiResponse({ status: 200, description: `FacilitadorEs retrieved`, type: FacilitadorEsCreateDto })
  async get(@Param('id') id: string) {
    return super.get(id)
  }

  @Get()
  @ApiOperation({ summary: `List FacilitadorEses` })
  @ApiResponse({ status: 200, description: `List of facilitadores`, type: [FacilitadorEsCreateDto] })
  @ApiQuery({ name: 'page', required: false, type: 'string', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'string', description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'q', required: false, type: 'string', description: 'Search query' })
  async list() {
    return super.list()
  }

  @Put(':id')
  @ApiBody({ type: FacilitadorEsUpdateDto })
  @ApiOperation({ summary: `Update FacilitadorEs` })
  @ApiResponse({ status: 201, description: `FacilitadorEs updated`, type: FacilitadorEsUpdateDto })
  async update(@Param('id') id: string, @Body() data: FacilitadorEsUpdateDto) {
    return super.update(id, data)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: `Delete FacilitadorEs` })
  @ApiResponse({ status: 200, description: `FacilitadorEs deleted` })
  async delete(@Param('id') id: string) {
    return super.delete(id)
  }
}
