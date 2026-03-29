import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsUUID } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'


export class StocktransferBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsOptional()
  onDelete!: any

  @ApiProperty()
  @IsOptional()
  @IsString()
  productName!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  fromSectorName!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  toSectorName!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity!: number

  @ApiProperty()
  @IsOptional()
  transferDate!: Date
}
