import { PartialType } from '@nestjs/swagger'
import { SectorCreateDto } from './sector.post.dto'

export class SectorUpdateDto extends PartialType(SectorCreateDto) {}
