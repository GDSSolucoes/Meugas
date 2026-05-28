import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import {
  FacilitadorRegimeTributarioEnum,
  FacilitadorModeloFiscalEnum,
  FacilitadorTipoOperacaoEnum,
} from "../../../database/schemas";

export class FacilitadorEsBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsOptional()
  @IsUUID()
  empresaId!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nome!: string;

  @ApiProperty({ enum: FacilitadorModeloFiscalEnum })
  @IsNotEmpty()
  modeloFiscal!: FacilitadorModeloFiscalEnum;

  @ApiProperty({ enum: FacilitadorTipoOperacaoEnum })
  @IsNotEmpty()
  tipoOperacao!: FacilitadorTipoOperacaoEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cfop!: string;

  @ApiProperty({ enum: FacilitadorRegimeTributarioEnum })
  @IsNotEmpty()
  regimeTributario!: FacilitadorRegimeTributarioEnum;

  @ApiProperty()
  @IsOptional()
  @IsString()
  icmsSituacaoTributaria!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  pisSituacaoTributaria!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  cofinsSituacaoTributaria!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  ipiSituacaoTributaria!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  observacoes!: string;
}
