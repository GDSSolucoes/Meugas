import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsUUID } from "class-validator";

export class BudgetItemsItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  productId!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  unitPrice!: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  total!: number;
}
