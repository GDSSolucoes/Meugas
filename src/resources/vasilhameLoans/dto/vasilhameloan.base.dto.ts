import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'
import { VasilhameLoanStatusEnum } from '../../../database/schemas'

export class VasilhameloanBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsOptional()
  onDelete!: any

  @ApiProperty()
  @IsOptional()
  @IsString()
  personName!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  vasilhameId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  vasilhameName!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  loanQuantity!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  returnedQuantity!: number

  @ApiProperty()
  @IsOptional()
  loanDate!: Date

  @ApiProperty()
  @IsOptional()
  status!: VasilhameLoanStatusEnum
}
