import { PartialType } from '@nestjs/swagger'
import { SalEsCreateDto } from './sales.post.dto'

export class SalEsUpdateDto extends PartialType(SalEsCreateDto) {}
