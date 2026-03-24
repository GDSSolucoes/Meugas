import { ApiProperty } from '@nestjs/swagger'
import { PersonAddress, PersonTypeEnum } from '../../../database/schemas'

export class PeoplePostDto {
    @ApiProperty()
    personNumber?: string
    @ApiProperty()
    name!: string
    @ApiProperty()
    document?: string
    @ApiProperty()
    email?: string
    @ApiProperty()
    phone?: string[]
    @ApiProperty({enum: PersonTypeEnum, required: true})
    type!: PersonTypeEnum
    @ApiProperty()
    address?: PersonAddress
    @ApiProperty()
    glpConsumptionDays?: string
    @ApiProperty()
    birthday?: Date
    @ApiProperty()
    conveniadaId?: string
    @ApiProperty()
    conveniadaName?: string
    @ApiProperty()
    companyName?: string
    @ApiProperty()
    createdByName?: string
}
