import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MinLength } from 'class-validator'

export class SearchAddressDto {
  @ApiProperty({ description: 'Sigla do estado', example: 'SP' })
  @IsString()
  @IsNotEmpty()
  state!: string

  @ApiProperty({ description: 'Nome da cidade', example: 'Sao Paulo' })
  @IsString()
  @IsNotEmpty()
  city!: string

  @ApiProperty({ description: 'Nome da rua', example: 'Avenida Paulista', minLength: 3 })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  street!: string
}
