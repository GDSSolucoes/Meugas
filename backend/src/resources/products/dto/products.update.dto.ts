import { PartialType } from "@nestjs/swagger";
import { ProductsCreateDto } from "./products.post.dto";

export class ProductsUpdateDto extends PartialType(ProductsCreateDto) {}
