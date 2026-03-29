import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'


export class FuelingBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  vehicleId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  vehiclePlate!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  vehicleDescription!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  fleetNumber!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  driverId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  driverName!: string

  @ApiProperty()
  @IsNotEmpty()
  fuelingDate!: Date

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  currentKm!: number

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  liters!: number

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  totalValue!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  pricePerLiter!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  kmTraveled!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  consumption!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  costPerKm!: number

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  createExpense!: boolean

  @ApiProperty()
  @IsOptional()
  @IsString()
  cashMovementId!: string

  @ApiProperty()
  @IsOptional()
  onDelete!: any
}
