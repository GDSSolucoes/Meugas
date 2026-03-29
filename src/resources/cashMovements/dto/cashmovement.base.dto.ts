import { ApiProperty } from '@nestjs/swagger'            
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator'
import { BaseGetDto } from '../../../common/dto/base-get.dto'
import { CashMovementTypeEnum } from '../../../database/schemas'

export class CashmovementBaseDto extends BaseGetDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  cashAccountName!: string

  @ApiProperty()
  @IsNotEmpty()
  type!: CashMovementTypeEnum

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount!: number

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description!: string

  @ApiProperty()
  @IsOptional()
  movementDate!: Date

  @ApiProperty()
  @IsOptional()
  @IsString()
  personName!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  groupId!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  groupName!: string

  @ApiProperty()
  @IsOptional()
  @IsString()
  relatedDocId!: string

  @ApiProperty()
  @IsOptional()
  onDelete!: any
}
