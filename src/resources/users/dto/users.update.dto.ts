import { ApiProperty } from '@nestjs/swagger'

export class UsersUpdateDto {
  @ApiProperty({ required: false })
  email?: string
  @ApiProperty({ required: false })
  name?: string
  @ApiProperty({ required: false })
  password?: string
  @ApiProperty({ required: false })
  cpf?: string | null
  @ApiProperty({ required: false })
  role?: string | null
  @ApiProperty({ required: false })
  active?: boolean
}
