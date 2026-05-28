import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";
import { UserTypeEnum, UserRoleEnum } from "../../../database/schemas";

export class UserBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ enum: UserRoleEnum })
  @IsNotEmpty()
  role!: UserRoleEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  cpf!: string;

  @ApiProperty({ enum: UserTypeEnum })
  @IsNotEmpty()
  userType!: UserTypeEnum;

  @ApiProperty()
  @IsOptional()
  @IsString()
  phone!: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  department!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  passwordHash!: string;
}
