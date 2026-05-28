import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
} from "class-validator";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import {
  IcmsOrigemEnum,
  ProductCategoriesEnum,
} from "../../../database/schemas";

export class ProductsBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsOptional()
  category!: ProductCategoriesEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  unitPrice!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  costPrice!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  minStock!: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  vasilhameId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  vasilhameName!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  ncm!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  cest!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  unidadeTributavel!: string;

  @ApiProperty()
  @IsOptional()
  icmsOrigem!: IcmsOrigemEnum;

  @ApiProperty()
  @IsOptional()
  @IsString()
  beneficioFiscal!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  anpCodigo!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  anpDescricao!: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  valorSemIcmsKg!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  kgPorUnidadeGlp!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  percentualGlp!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  percentualGnNacional!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  percentualGnImportado!: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  codif!: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  pesoLiquido!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  pesoBruto!: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  informacoesAdicionaisNfe!: string;
}
