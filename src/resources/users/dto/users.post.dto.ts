import { ApiProperty } from '@nestjs/swagger'
import { userRoleEnum, userTypeEnum } from '../../../database/schemas'

export class UsersPostDto {
  @ApiProperty()
  name!: string
  @ApiProperty()
  email!: string
  @ApiProperty({ required: false })
  cpf?: string
  @ApiProperty({ required: false })
  phone?: string
  @ApiProperty()
  password!: string
  @ApiProperty()
  companyId!: string

  role?: userRoleEnum
  user_type?: userTypeEnum
}
