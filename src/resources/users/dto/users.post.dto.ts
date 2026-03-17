import { ApiProperty } from '@nestjs/swagger'

export class UsersPostDto {
  @ApiProperty()
  email!: string
  @ApiProperty()
  name!: string
  @ApiProperty()
  password!: string
  @ApiProperty({ required: false })
  cpf?: string
  @ApiProperty()
  companyId!: number
  @ApiProperty()
  role!: string
  @ApiProperty({ required: false })
  active?: boolean
}
