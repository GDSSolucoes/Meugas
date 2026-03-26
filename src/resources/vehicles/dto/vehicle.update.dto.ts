import { PartialType } from '@nestjs/swagger'
import { VehiclePostDto } from './vehicle.post.dto'

export class VehicleUpdateDto extends PartialType(VehiclePostDto) {}