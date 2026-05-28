import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsString } from 'class-validator'
import { BaseCreateDto } from "../../../common/dto/base-create.dto";


export class SectormasterBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name!: string
}
