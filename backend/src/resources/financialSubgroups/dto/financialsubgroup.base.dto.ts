import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { BaseCreateDto } from "../../../common/dto/base-create.dto";


export class FinancialsubgroupBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  financialGroupId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  financialGroupName!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  description!: string
}
