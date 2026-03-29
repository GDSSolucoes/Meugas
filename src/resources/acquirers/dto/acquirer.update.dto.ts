import { PartialType } from '@nestjs/swagger'
import { AcquirerCreateDto } from './acquirer.post.dto'

export class AcquirerUpdateDto extends PartialType(AcquirerCreateDto) {}
