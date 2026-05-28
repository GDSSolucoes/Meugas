import { PartialType } from '@nestjs/swagger'
import { UserCreateDto } from './user.post.dto'

export class UserUpdateDto extends PartialType(UserCreateDto) {}
