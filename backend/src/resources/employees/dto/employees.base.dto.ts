import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  ValidateIf,
} from "class-validator";
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

  @ApiProperty({ required: false })
  @ValidateIf((employee: EmployeEsBaseDto) =>
    employee.position === EmployeePositionEnum.ENTREGADOR,
  )
  @IsNotEmpty()
  @IsString()
  sectorId?: string | null;

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
