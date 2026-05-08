import { PartialType } from '@nestjs/swagger'
import { ProductpickupCreateDto } from './productpickup.post.dto'

export class ProductpickupUpdateDto extends PartialType(ProductpickupCreateDto) {}
