import { PartialType } from '@nestjs/swagger'
import { ProductstockCreateDto } from './productstock.post.dto'

export class ProductstockUpdateDto extends PartialType(ProductstockCreateDto) {}
