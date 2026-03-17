import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { PeopleService } from './people.service'
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { CurrentUser } from '../../auth/current-user.decorator'
import { PeoplePostDto } from './dto/people.post.dto'
import { PeopleUpdateDto } from './dto/people.update.dto'
import { RlsService } from '../../database/rls/rls.service'

@ApiTags('People')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('people')
export class PeopleController {
  constructor(private readonly service: PeopleService, private readonly rls: RlsService) {}

  @Get()
  async list(@CurrentUser() user: any, @Query('q') q?: string) {
    return this.service.list(user.company_id, q)
  }

  @Get(':id')
  async get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.get(user.company_id, id)
  }

  @Post()
  @ApiBody({ type: PeoplePostDto })
  async create(@CurrentUser() user: any, @Body() body: PeoplePostDto) {
    return this.service.create(user.company_id, body)
  }

  @Put(':id')
  @ApiBody({ type: PeopleUpdateDto })
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: PeopleUpdateDto) {
    return this.service.update(user.company_id, id, body)
  }
}
