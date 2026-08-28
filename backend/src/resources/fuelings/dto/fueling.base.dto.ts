import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { parseDateOnly } from "../../../database/schemas/date-only";

export class FuelingBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  vehicleId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  vehiclePlate!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  vehicleDescription!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  fleetNumber!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  driverId!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  driverName!: string;

  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
  fuelingDate!: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  currentKm!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  liters!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalValue!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  pricePerLiter!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  kmTraveled!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  consumption!: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  costPerKm!: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  createExpense!: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  cashMovementId!: string;
}
