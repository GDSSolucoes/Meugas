import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class BudgetCustomerDataDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  name!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  street!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  number!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  complement!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  neighborhood!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  city!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  state!: string

}
