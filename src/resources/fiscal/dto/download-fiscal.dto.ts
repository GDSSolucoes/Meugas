import { ApiProperty } from '@nestjs/swagger'
import { IsIn, IsNotEmpty, IsString } from 'class-validator'

export class DownloadFiscalDto {
  @ApiProperty({ description: 'ID da venda' })
  @IsString()
  @IsNotEmpty()
  saleId!: string

  @ApiProperty({ description: 'Tipo de nota a ser baixada', enum: ['nfe', 'nfce'] })
  @IsString()
  @IsIn(['nfe', 'nfce'])
  @IsNotEmpty()
  type!: 'nfe' | 'nfce'
}
