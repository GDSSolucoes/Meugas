import { ApiProperty } from '@nestjs/swagger'

export class ProductsUpdateDto {
  @ApiProperty({ required: false })
  name?: string
  @ApiProperty({ required: false })
  code?: string | null
  @ApiProperty({ required: false })
  category?: string | null
  @ApiProperty({ required: false })
  unitPrice?: number | null
  @ApiProperty({ required: false })
  costPrice?: number | null
  @ApiProperty({ required: false })
  minStock?: number | null
  @ApiProperty({ required: false })
  vasilhameId?: string | null
  @ApiProperty({ required: false })
  vasilhameName?: string | null
  @ApiProperty({ required: false })
  ncm?: string | null
  @ApiProperty({ required: false })
  cest?: string | null
  @ApiProperty({ required: false })
  active?: boolean
}
