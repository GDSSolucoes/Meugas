import { ApiProperty } from '@nestjs/swagger'

export class ProductsPostDto {
  @ApiProperty()
  name!: string
  @ApiProperty({ required: false })
  code?: string
  @ApiProperty({ required: false })
  category?: string
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
