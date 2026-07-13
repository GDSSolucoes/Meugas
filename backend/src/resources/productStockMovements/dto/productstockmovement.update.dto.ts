import { PartialType } from '@nestjs/swagger'
import { ProductstockmovementBaseDto } from './productstockmovement.base.dto'

export class ProductstockmovementUpdateDto extends PartialType(ProductstockmovementBaseDto) {}
