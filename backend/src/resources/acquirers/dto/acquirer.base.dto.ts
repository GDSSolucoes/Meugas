import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'


export class AcquirerBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  feePercentage!: number

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  settlementDays!: number

  @ApiProperty()
  @IsOptional()
  onDelete!: any

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  active!: boolean
}
