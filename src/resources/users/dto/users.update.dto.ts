import { ApiProperty } from '@nestjs/swagger'
import { userRoleEnum, userTypeEnum } from '../../../database/schemas'

export class UsersUpdateDto {
  @ApiProperty({ required: false })
  name?: string
  @ApiProperty({ required: false, enum: userRoleEnum })
  role?: userRoleEnum
  @ApiProperty({ required: false })
  email?: string
  @ApiProperty({ required: false })
  cpf?: string
  @ApiProperty({ required: false, enum: userTypeEnum })
  user_type?: userTypeEnum
  @ApiProperty({ required: false })
  phone?: string
  @ApiProperty({ required: false })
  department?: string
  @ApiProperty({ required: false })
  active?: boolean
  @ApiProperty({ required: false })
  password?: string
}
