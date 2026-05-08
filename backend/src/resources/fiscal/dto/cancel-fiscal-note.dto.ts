import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class CancelFiscalNoteDto {
  @ApiProperty({ description: 'ID da venda' })
  @IsString()
  @IsNotEmpty()
  saleId!: string

  @ApiProperty({ description: 'Tipo de nota fiscal', enum: ['nfe', 'nfce'] })
  @IsString()
  @IsIn(['nfe', 'nfce'])
  @IsNotEmpty()
  tipoNota!: 'nfe' | 'nfce'

  @ApiProperty({ description: 'Justificativa para o cancelamento', minLength: 15 })
  @IsString()
  @IsNotEmpty()
  @MinLength(15)
  justificativa!: string
}
