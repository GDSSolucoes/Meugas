import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator'
import { BaseCreateDto } from "../../../common/dto/base-create.dto";


export class SectorBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string

  @ApiProperty()
  @IsOptional()
  @IsUUID()
  employeeId!: string

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
  @IsUUID()
  masterSectorId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  masterSectorName!: string
}
