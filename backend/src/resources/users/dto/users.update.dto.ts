import { ApiProperty } from "@nestjs/swagger";
import { UserRoleEnum, UserTypeEnum } from "../../../database/schemas";

export class UsersUpdateDto {
  @ApiProperty({ required: false })
  name?: string;
  @ApiProperty({ required: false, enum: UserRoleEnum })
  role?: UserRoleEnum;
  @ApiProperty({ required: false })
  email?: string;
  @ApiProperty({ required: false })
  cpf?: string;
  @ApiProperty({ required: false, enum: UserTypeEnum })
  userType?: UserTypeEnum;
  @ApiProperty({ required: false })
  phone?: string;
  @ApiProperty({ required: false })
  department?: string;
  @ApiProperty({ required: false })
  active?: boolean;
  @ApiProperty({ required: false })
  password?: string;
}
