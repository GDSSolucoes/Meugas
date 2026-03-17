import { ApiProperty } from '@nestjs/swagger'

export class PeoplePostDto {
  @ApiProperty()
  name!: string
  @ApiProperty({ required: false })
  document?: string
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
  @ApiProperty({ required: false })
  zipcode?: string
  @ApiProperty({ required: false })
  phone?: string
}
