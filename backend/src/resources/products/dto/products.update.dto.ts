import { PartialType } from '@nestjs/swagger'
import { ProductsBaseDto } from './products.base.dto'

export class ProductsUpdateDto extends PartialType(ProductsBaseDto) {
}
