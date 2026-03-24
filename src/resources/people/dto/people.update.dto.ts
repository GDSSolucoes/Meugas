import { ApiProperty } from '@nestjs/swagger'
import { PersonAddress, PersonTypeEnum } from '../../../database/schemas'

export class PeopleUpdateDto {
    @ApiProperty({required: false})
    personNumber?: string
    @ApiProperty({required: false})
    name!: string
    @ApiProperty({required: false})
    document?: string
    @ApiProperty({required: false})
    email?: string
    @ApiProperty({required: false})
    phone?: string[]
    @ApiProperty({enum: PersonTypeEnum, required: false})
    type!: PersonTypeEnum
    @ApiProperty({required: false})
    address?: PersonAddress
    @ApiProperty({required: false})
    glpConsumptionDays?: string
    @ApiProperty({required: false})
    birthday?: Date
    @ApiProperty({required: false})
    conveniadaId?: string
    @ApiProperty({required: false})
    conveniadaName?: string
    @ApiProperty({required: false})
    companyName?: string
}
