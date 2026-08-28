import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsDate } from "class-validator";
import { parseDateOnly } from "../../../database/schemas/date-only";

export class SaleInstallmentsDetailsDto {
  @ApiProperty()
  @IsNumber()
  number!: number;

  @ApiProperty()
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
  dueDate!: Date;

  @ApiProperty()
  @IsNumber()
  amount!: number;
}
