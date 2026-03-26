import { ApiProperty } from '@nestjs/swagger'
import { VehicleTypeEnum } from '../../../database/schemas'

export class VehiclePostDto {
  @ApiProperty()
  plate!: string
  @ApiProperty()
  fleetNumber?: string
  @ApiProperty({ enum: VehicleTypeEnum, required: true })
  type!: VehicleTypeEnum
  @ApiProperty()
  description!: string
  @ApiProperty()
  year?: number
  @ApiProperty()
  color?: string
  @ApiProperty()
  initialKm?: number
}