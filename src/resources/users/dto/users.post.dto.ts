import { ApiProperty } from '@nestjs/swagger'
import { UserRoleEnum } from '../enums/userRole.enum'
import { UserTypeEnum } from '../enums/userType.enum'

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
  companyId!: number

  role?: UserRoleEnum
  user_type?: UserTypeEnum
}
