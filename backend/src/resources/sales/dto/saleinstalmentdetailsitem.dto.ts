import { ApiProperty } from "@nestjs/swagger";
import {
  IsNumber,
  IsDate,
} from "class-validator";

export class SaleInstallmentsDetailsDto {
  @ApiProperty()
  @IsNumber()
  number!: number;

  @ApiProperty()
  @IsDate()
  dueDate!: Date;

  @ApiProperty()
  @IsNumber()
  amount!: number;
}
