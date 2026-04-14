import { ApiProperty } from '@nestjs/swagger'

export class FiscalEmitResponseDto {
  @ApiProperty({ description: 'Se a operação foi bem-sucedida' })
  success!: boolean

  @ApiProperty({ description: 'Mensagem de retorno', required: false })
  message?: string

  @ApiProperty({ description: 'Número da NF-e', required: false })
  nfeNumber?: string

  @ApiProperty({ description: 'Número da NFC-e', required: false })
  nfceNumber?: string

  @ApiProperty({ description: 'Chave de acesso da NF-e', required: false })
  nfeKey?: string

  @ApiProperty({ description: 'Chave de acesso da NFC-e', required: false })
  nfceKey?: string

  @ApiProperty({ description: 'URL do DANFE', required: false })
  nfeUrl?: string

  @ApiProperty({ description: 'URL do DANFE NFC-e', required: false })
  nfceUrl?: string

  @ApiProperty({ description: 'URL do XML da NF-e', required: false })
  nfeXmlUrl?: string

  @ApiProperty({ description: 'URL do XML da NFC-e', required: false })
  nfceXmlUrl?: string

  @ApiProperty({ description: 'Status retornado pela Nuvem Fiscal', required: false })
  status?: string

  @ApiProperty({ description: 'Conteúdo PDF em Base64', required: false })
  pdfBase64?: string

  @ApiProperty({ description: 'Conteúdo XML em Base64', required: false })
  xmlBase64?: string

  @ApiProperty({ description: 'Nome sugerido para arquivo', required: false })
  filename?: string

  @ApiProperty({ description: 'Detalhes do erro', required: false })
  error?: string
}
