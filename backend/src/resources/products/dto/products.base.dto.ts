import { ApiProperty } from "@nestjs/swagger";
import { ProductCategoriesEnum } from "../../../database/schemas";
import { BaseGetDto } from "../../../common/dto/base-get.dto";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
} from "class-validator";

export class ProductsBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ enum: ProductCategoriesEnum })
  @IsEnum(ProductCategoriesEnum)
  @IsOptional()
  category?: ProductCategoriesEnum;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  minStock?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  vasilhameId?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  vasilhameName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  ncm?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  cest?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  unidadeTributavel?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  icmsOrigem?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  beneficioFiscal?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  anpCodigo?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  anpDescricao?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  valorSemIcmsKg?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  kgPorUnidadeGlp?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  percentualGlp?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  percentualGnNacional?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  percentualGnImportado?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  codif?: string;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  pesoLiquido?: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  pesoBruto?: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  informacoesAdicionaisNfe?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  createdByName?: string;
}
