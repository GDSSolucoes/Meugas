import { PartialType } from "@nestjs/swagger";
import { SalesCreateDto } from "./sales.post.dto";

export class SalesUpdateDto extends PartialType(SalesCreateDto) {}
