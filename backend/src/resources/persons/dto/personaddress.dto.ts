import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class PersonAddressDto {
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
  referencePoint!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  city!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  state!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  zipcode!: string

}
