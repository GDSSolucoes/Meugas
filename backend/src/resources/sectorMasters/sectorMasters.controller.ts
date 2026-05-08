import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger'
import { BaseCrudController } from '../../common/base-crud.controller'
import { SectormastersService } from './sectorMasters.service'
import { sectorMasters } from '../../database/schemas'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { SectormasterCreateDto } from './dto/sectormaster.post.dto'
import { Roles } from '../../auth/roles.decorator'
import { RolesGuard } from '../../auth/roles.guard'
import { SectormasterUpdateDto } from './dto/sectormaster.update.dto'

@ApiTags('sectorMasters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'user')
@Controller('sectorMasters')
export class SectormastersController extends BaseCrudController<typeof sectorMasters> {
  constructor(protected readonly service: SectormastersService) {
    super(service, 'sectorMasters', true)
  }

  @Post()
  @ApiBody({ type: SectormasterCreateDto })
  @ApiOperation({ summary: `Create Sectormaster` })
  @ApiResponse({ status: 201, description: `Sectormaster created`, type: SectormasterCreateDto })
  async create(@Body() data: SectormasterCreateDto) {
    return super.create(data)
  }

  @Get(':id')
  @ApiOperation({ summary: `Get Sectormaster by ID` })
  @ApiResponse({ status: 200, description: `Sectormaster retrieved`, type: SectormasterCreateDto })
  async get(@Param('id') id: string) {
    return super.get(id)
  }

  @Get()
  @ApiOperation({ summary: `List Sectormasters` })
  @ApiResponse({ status: 200, description: `List of sectorMasters`, type: [SectormasterCreateDto] })
  @ApiQuery({ name: 'page', required: false, type: 'string', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'string', description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'q', required: false, type: 'string', description: 'Search query' })
  async list() {
    return super.list()
  }

  @Put(':id')
  @ApiBody({ type: SectormasterUpdateDto })
  @ApiOperation({ summary: `Update Sectormaster` })
  @ApiResponse({ status: 201, description: `Sectormaster updated`, type: SectormasterUpdateDto })
  async update(@Param('id') id: string, @Body() data: SectormasterUpdateDto) {
    return super.update(id, data)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: `Delete Sectormaster` })
  @ApiResponse({ status: 200, description: `Sectormaster deleted` })
  async delete(@Param('id') id: string) {
    return super.delete(id)
  }
}
