import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class EmitFiscalDto {
  @ApiProperty({ description: 'ID da venda' })
  @IsString()
  @IsNotEmpty()
  saleId!: string

  @ApiProperty({ description: 'ID do facilitador fiscal' })
  @IsString()
  @IsNotEmpty()
  facilitadorId!: string
}
