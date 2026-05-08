import { Inject, Injectable } from '@nestjs/common'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { products } from '../../database/schemas'
import { and, eq, ilike } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { ProductsPostDto } from './dto/products.post.dto'
import { ProductsUpdateDto } from './dto/products.update.dto'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'

@Injectable()
export class ProductsService extends BaseCrudService<typeof products> {

  constructor(requestContext: RequestContextService) {
    super(requestContext, products, true) // hasCompanyId = true
  }

}
