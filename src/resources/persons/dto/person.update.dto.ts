import { PartialType } from '@nestjs/swagger'
import { PersonCreateDto } from './person.post.dto'

export class PersonUpdateDto extends PartialType(PersonCreateDto) {}
