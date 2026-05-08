import { PartialType } from '@nestjs/swagger'
import { CompanyPostDto } from './companies.post.dto';

export class CompanyUpdateDto  extends PartialType(CompanyPostDto) {
}
