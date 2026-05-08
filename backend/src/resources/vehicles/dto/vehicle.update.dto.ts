import { PartialType } from '@nestjs/swagger'
import { VehicleCreateDto } from './vehicle.post.dto'

export class VehicleUpdateDto extends PartialType(VehicleCreateDto) {}