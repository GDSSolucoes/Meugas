import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'
import { FacilitadorTipoOperacaoEnum, FacilitadorRegimeTributarioEnum } from '../../../database/schemas'

export class FacilitadorEsBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  empresaId!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nome!: string

  @ApiProperty()
  @IsNotEmpty()
  tipoOperacao!: FacilitadorTipoOperacaoEnum

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cfop!: string

  @ApiProperty()
  @IsNotEmpty()
  regimeTributario!: FacilitadorRegimeTributarioEnum

  @ApiProperty()
  @IsOptional()
  @IsString()
  icmsSituacaoTributaria!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  pisSituacaoTributaria!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  cofinsSituacaoTributaria!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  ipiSituacaoTributaria!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  observacoes!: string

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  ativo!: boolean

  @ApiProperty()
  @IsOptional()
  onDelete!: any
}
