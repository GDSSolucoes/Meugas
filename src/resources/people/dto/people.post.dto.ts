import { ApiProperty } from '@nestjs/swagger'
import { PeopleType } from '../enums/peopleType.enum'
import { PersonAddressDto } from './peopleAddres.dto'

export class PeoplePostDto {
    companyId!: number
    personNumber?: string
    name!: string
    document?: string
    email?: string
    phone?: string[]
    type!: PeopleType
    address?: PersonAddressDto
    glpConsumptionDays?: number
    birthday?: Date
    conveniadaId?: string
    conveniadaName?: string
    companyName?: string
    createdByName?: string
}
