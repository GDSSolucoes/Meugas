import { PartialType } from '@nestjs/swagger'
import { FacilitadorEsCreateDto } from './facilitadores.post.dto'

export class FacilitadorEsUpdateDto extends PartialType(FacilitadorEsCreateDto) {}
