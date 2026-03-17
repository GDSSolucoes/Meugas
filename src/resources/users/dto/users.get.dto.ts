import { ApiProperty } from '@nestjs/swagger'

export class UsersGetDto {
  @ApiProperty()
  id!: string
  @ApiProperty()
  email!: string
  @ApiProperty({ required: false })
  cpf?: string | null
  @ApiProperty()
  name!: string
  @ApiProperty()
  companyId!: number
  @ApiProperty()
  role!: string
  @ApiProperty()
  active!: boolean
  @ApiProperty({ required: false })
  createdAt?: string
}
