import { ApiProperty } from '@nestjs/swagger'

export class PeopleUpdateDto {
  @ApiProperty({ required: false })
  name?: string
  @ApiProperty({ required: false })
  document?: string | null
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
  @ApiProperty({ required: false })
  zipcode?: string | null
  @ApiProperty({ required: false })
  phone?: string | null
  @ApiProperty({ required: false })
  active?: boolean
}
