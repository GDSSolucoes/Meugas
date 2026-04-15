import { PartialType } from '@nestjs/swagger'
import { CompanyPostDto } from './company.post.dto';

export class CompanyUpdateDto  extends PartialType(CompanyPostDto) {
}
