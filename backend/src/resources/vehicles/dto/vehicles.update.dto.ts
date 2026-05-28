import { PartialType } from "@nestjs/swagger";
import { VehiclesCreateDto } from "./vehicles.post.dto";

export class VehiclesUpdateDto extends PartialType(VehiclesCreateDto) {}
