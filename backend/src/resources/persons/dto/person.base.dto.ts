import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { PersonAddressDto } from "./personaddress.dto";
import { PersonTypeEnum } from "../../../database/schemas";

export class PersonBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  personNumber!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  document!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  email!: string;

  @ApiProperty()
  @IsOptional()
  phone!: string[];

  @ApiProperty()
  @IsNotEmpty()
  type!: PersonTypeEnum;

  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonAddressDto)
  address!: PersonAddressDto;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  glpConsumptionDays!: number;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  birthday!: Date;

  @ApiProperty()
  @IsOptional()
  @IsString()
  conveniadaId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  conveniadaName!: string;
}
