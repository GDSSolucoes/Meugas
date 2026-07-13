import { IsDateString, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { BaseCreateDto } from '../../../common/dto/base-create.dto'

export class ProductstockmovementBaseDto extends BaseCreateDto {
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
  @IsUUID()
  sectorId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sectorName?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  saleId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  purchaseId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  stockTransferId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  productPickupId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  vasilhameLoanId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  quantity?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  previousBalance?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  newBalance?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  movementDate?: string
}
