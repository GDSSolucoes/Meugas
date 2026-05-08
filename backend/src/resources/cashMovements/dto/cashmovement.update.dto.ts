import { PartialType } from '@nestjs/swagger'
import { CashmovementCreateDto } from './cashmovement.post.dto'

export class CashmovementUpdateDto extends PartialType(CashmovementCreateDto) {}
