import { ApiProperty } from '@nestjs/swagger'
import { ProductsBaseDto } from './products.base.dto'

export class ProductsGetDto extends ProductsBaseDto {
  @ApiProperty()
  id!: string
  @ApiProperty()
  companyId!: number
  @ApiProperty({ required: false })
  active?: boolean
}
