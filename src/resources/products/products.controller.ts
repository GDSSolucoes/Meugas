import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ProductsService } from './products.service'
import { ApiTags, ApiBearerAuth, ApiBody } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { CurrentUser } from '../../auth/current-user.decorator'
import { ProductsPostDto } from './dto/products.post.dto'
import { ProductsUpdateDto } from './dto/products.update.dto'
import { RlsService } from '../../database/rls/rls.service'

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService, private readonly rls: RlsService) {}

  @Get()
  async list(@CurrentUser() user: any, @Query('q') q?: string) {
    return this.service.list(user.companyId, q)
  }

  @Get(':id')
  async get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.get(user.companyId, id)
  }

  @Post()
  @ApiBody({ type: ProductsPostDto })
  async create(@CurrentUser() user: any, @Body() body: ProductsPostDto) {
    return this.service.create(user.companyId, body)
  }

  @Put(':id')
  @ApiBody({ type: ProductsUpdateDto })
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() body: ProductsUpdateDto) {
    return this.service.update(user.companyId, id, body)
  }
}
