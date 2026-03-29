import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'


export class SectormasterBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string

  @ApiProperty()
  @IsOptional()
  onDelete!: any
}
