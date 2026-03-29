import { PartialType } from '@nestjs/swagger'
import { ContasapagarCreateDto } from './contasapagar.post.dto'

export class ContasapagarUpdateDto extends PartialType(ContasapagarCreateDto) {}
