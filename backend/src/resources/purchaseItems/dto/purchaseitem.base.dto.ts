import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { BaseCreateDto } from '../../../common/dto/base-create.dto'

export class PurchaseitemBaseDto extends BaseCreateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  purchaseId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  productId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productName?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  quantity?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  unitPrice?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  total?: number
}
