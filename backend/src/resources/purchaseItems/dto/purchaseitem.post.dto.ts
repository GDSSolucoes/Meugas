import { IsNumber, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { PurchaseitemBaseDto } from './purchaseitem.base.dto'

export class PurchaseitemCreateDto extends PurchaseitemBaseDto {
  @ApiProperty()
  @IsUUID()
  purchaseId!: string

  @ApiProperty()
  @IsNumber()
  quantity!: number
}
