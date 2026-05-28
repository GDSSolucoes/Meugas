import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from "class-validator";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { VehicleTypeEnum } from "../../../database/schemas";

export class VehiclesBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  plate!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fleetNumber!: string;

  @ApiProperty()
  @IsNotEmpty()
  type!: VehicleTypeEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  year!: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  color!: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  initialKm!: number;
}
