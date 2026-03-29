import { PartialType } from '@nestjs/swagger'
import { SectormasterCreateDto } from './sectormaster.post.dto'

export class SectormasterUpdateDto extends PartialType(SectormasterCreateDto) {}
