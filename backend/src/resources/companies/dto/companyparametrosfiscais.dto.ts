import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  ValidateNested,
} from "class-validator";

export class CompanyParametrosFiscaisDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  cnpj!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  razaoSocial!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  inscricaoEstadual!: string;

  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  ambienteNfe!: "homologacao" | "producao";

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  emitirNfe!: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  emitirNfce!: boolean;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  serieNfe!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  serieNfce!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  numeroInicialNfe!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  numeroInicialNfce!: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  observacoesNfe!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  observacoesNfce!: string;
}
