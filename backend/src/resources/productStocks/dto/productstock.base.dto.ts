import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID } from 'class-validator'
import { Type } from "class-transformer";
import { BaseCreateDto } from "../../../common/dto/base-create.dto";


export class ProductstockBaseDto extends BaseCreateDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  productId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  productName!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  sectorId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  sectorName!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity!: number

  @ApiProperty()
  @IsOptional()
  @Type(() => Date)
  initialDate!: Date
}
