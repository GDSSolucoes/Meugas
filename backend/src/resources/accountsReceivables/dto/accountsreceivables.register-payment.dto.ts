import { IsArray, IsDateString, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AccountsReceivablesRegisterPaymentDto {
  @ApiProperty()
  @IsArray()
  @IsUUID("4", { each: true })
  @IsNotEmpty()
  accountReceivableIds!: string[];

  @ApiProperty()
  @IsString()
  @IsUUID("4")
  @IsNotEmpty()
  cashAccountId!: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  paymentDate!: string;
}
