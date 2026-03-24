import { ApiProperty } from '@nestjs/swagger'
import { ProductCategoriesEnum } from '../../../database/schemas'

export class ProductsUpdateDto {
  @ApiProperty({ required: false })
  name?: string
  @ApiProperty({ required: false })
  code?: string
  @ApiProperty({ required: false, enum: ProductCategoriesEnum })
  category?:ProductCategoriesEnum  
  @ApiProperty({ required: false })
  unitPrice?: number
  @ApiProperty({ required: false })
  costPrice?: number
  @ApiProperty({ required: false })
  minStock?: number
  @ApiProperty({ required: false })
  vasilhameId?: string
  @ApiProperty({ required: false })
  vasilhameName?: string
  @ApiProperty({ required: false })
  ncm?: string
  @ApiProperty({ required: false })
  cest?: string
}
