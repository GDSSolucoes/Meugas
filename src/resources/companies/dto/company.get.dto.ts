import { ApiProperty } from '@nestjs/swagger'

export class CompanyGetDto {
  @ApiProperty()
  id!: number
  @ApiProperty()
  name!: string
  @ApiProperty({ required: false })
  cnpj?: string | null
  @ApiProperty({ required: false })
  street?: string | null
  @ApiProperty({ required: false })
  number?: string | null
  @ApiProperty({ required: false })
  neighborhood?: string | null
  @ApiProperty({ required: false })
  city?: string | null
  @ApiProperty({ required: false })
  state?: string | null
}
