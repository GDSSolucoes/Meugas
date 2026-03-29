import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'


export class SectorBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  employeeName!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  phone!: string

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isOwnStock!: boolean

  @ApiProperty()
  @IsOptional()
  @IsString()
  masterSectorName!: string

  @ApiProperty()
  @IsOptional()
  onDelete!: any

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  active!: boolean
}
