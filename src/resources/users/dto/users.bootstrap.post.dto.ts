import { ApiProperty } from '@nestjs/swagger'

export class UsersBootstrapPostDto {
  @ApiProperty()
  email!: string
  @ApiProperty()
  name!: string
  @ApiProperty()
  password!: string
}
