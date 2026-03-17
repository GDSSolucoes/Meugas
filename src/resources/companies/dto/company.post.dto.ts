import { ApiProperty } from '@nestjs/swagger'

export class CompanyPostDto {
  @ApiProperty()
  name!: string
  @ApiProperty({ required: false })
  cnpj?: string
  @ApiProperty({ required: false })
  street?: string
  @ApiProperty({ required: false })
  number?: string
  @ApiProperty({ required: false })
  neighborhood?: string
  @ApiProperty({ required: false })
  city?: string
  @ApiProperty({ required: false })
  state?: string
}
