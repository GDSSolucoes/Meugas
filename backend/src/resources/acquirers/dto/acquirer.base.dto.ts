import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator'
import { BaseCreateDto } from "../../../common/dto/base-create.dto";


export class AcquirerBaseDto extends BaseCreateDto {
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
}
