import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { CompaniesService } from './companies.service'
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { RolesGuard } from '../../auth/roles.guard'
import { Roles } from '../../auth/roles.decorator'
import { CompanyPostDto } from './dto/company.post.dto'
import { CompanyUpdateDto } from './dto/company.update.dto'

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.get(id)
  }

  @Post()
  @Roles('admin')
  @ApiBody({ type: CompanyPostDto })
  async create(@Body() body: CompanyPostDto) {
    return this.service.create(body)
  }

  @Put(':id')
  @Roles('admin')
  @ApiBody({ type: CompanyUpdateDto })
  async update(@Param('id') id: string, @Body() body: CompanyUpdateDto) {
    return this.service.update(id, body)
  }
}
