import { PartialType } from '@nestjs/swagger'
import { PaymenttypEsCreateDto } from './paymenttypes.post.dto'

export class PaymenttypEsUpdateDto extends PartialType(PaymenttypEsCreateDto) {}
