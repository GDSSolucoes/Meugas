import { ApiProperty } from "@nestjs/swagger";
import { UserRoleEnum, UserTypeEnum } from "../../../database/schemas";

export class UsersPostDto {
  @ApiProperty()
  name!: string;
  @ApiProperty()
  email!: string;
  @ApiProperty({ required: false })
  cpf?: string;
  @ApiProperty({ required: false })
  phone?: string;
  @ApiProperty()
  password!: string;
  @ApiProperty()
  companyId!: string;

  role?: UserRoleEnum;
  userType?: UserTypeEnum;
}
