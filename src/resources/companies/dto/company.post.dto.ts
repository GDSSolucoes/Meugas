import { ApiProperty } from '@nestjs/swagger'
import { CompanyAddress, CompanyParametrosFiscais, CompanyStatusEnum, PlanTypeEnum } from '../../../database/schemas'

export class CompanyPostDto {
  @ApiProperty()
  name!: string
  @ApiProperty()
  document!: string
  @ApiProperty()
  email!: string
  @ApiProperty({ required: false })
  phone?: string
  @ApiProperty({ required: false })
  address?: CompanyAddress
  @ApiProperty({ required: false })
  parametros_fiscais?: CompanyParametrosFiscais
  @ApiProperty({ enum: PlanTypeEnum, default: PlanTypeEnum.BASIC, required: false })
  plano?: PlanTypeEnum
  @ApiProperty({ required: false, enum: CompanyStatusEnum, default: CompanyStatusEnum.ATIVA })
  status?: CompanyStatusEnum
  @ApiProperty()
  admin_name!: string
  @ApiProperty()
  admin_email!: string
}
