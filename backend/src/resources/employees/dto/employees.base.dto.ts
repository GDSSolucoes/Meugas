import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { EmployeePositionEnum } from "../../../database/schemas";

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
  @Type(() => Date)
  hireDate!: Date;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  vacationStart!: Date;

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  vacationEnd!: Date;
}
