import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'


export class AccountsreceivablEsBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsOptional()
  onDelete!: any

  @ApiProperty()
  @IsOptional()
  @IsString()
  personName!: string

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  installmentNumber!: number

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description!: string

  @ApiProperty()
  @IsNotEmpty()
  dueDate!: Date

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount!: number

  @ApiProperty()
  @IsOptional()
  paymentDate!: Date
}
