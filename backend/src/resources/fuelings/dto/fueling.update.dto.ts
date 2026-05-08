import { PartialType } from '@nestjs/swagger'
import { FuelingCreateDto } from './fueling.post.dto'

export class FuelingUpdateDto extends PartialType(FuelingCreateDto) {}
