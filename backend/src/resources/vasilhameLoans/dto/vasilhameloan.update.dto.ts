import { PartialType } from '@nestjs/swagger'
import { VasilhameloanCreateDto } from './vasilhameloan.post.dto'

export class VasilhameloanUpdateDto extends PartialType(VasilhameloanCreateDto) {}
