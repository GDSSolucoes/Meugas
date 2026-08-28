import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsNumber } from "class-validator";
import { Transform } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { EmployeePositionEnum } from "../../../database/schemas";
import { parseDateOnly } from "../../../database/schemas/date-only";

export class EmployeEsBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  document!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  email!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  phone!: string;

  @ApiProperty({ enum: EmployeePositionEnum })
  @IsNotEmpty()
  position!: EmployeePositionEnum;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  salary!: number;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
  hireDate!: Date;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
  vacationStart!: Date;

  @ApiProperty()
  @IsOptional()
  @Transform(({ value }) => parseDateOnly(value), { toClassOnly: true })
  vacationEnd!: Date;
}
