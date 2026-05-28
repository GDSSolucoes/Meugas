import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { CompanyParametrosFiscaisDto } from "./companyparametrosfiscais.dto";
import { CompanyAddressDto } from "./companyaddress.dto";
import { CompanyStatusEnum, PlanTypeEnum } from "../../../database/schemas";

export class CompanyBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  document!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  phone!: string;

  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyAddressDto)
  address!: CompanyAddressDto;

  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyParametrosFiscaisDto)
  parametrosFiscais!: CompanyParametrosFiscaisDto;

  @ApiProperty({
    enum: PlanTypeEnum,
    default: PlanTypeEnum.BASIC,
    required: false,
  })
  @IsOptional()
  planType!: PlanTypeEnum;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  monthlyFee!: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  dueDate!: Date;

  @ApiProperty({
    required: false,
    enum: CompanyStatusEnum,
    default: CompanyStatusEnum.ATIVA,
  })
  @IsOptional()
  status!: CompanyStatusEnum;

  @ApiProperty()
  @IsOptional()
  @IsString()
  suspensionReason!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  adminName!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  adminEmail!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  notes!: string;
}
