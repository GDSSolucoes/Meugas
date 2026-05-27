import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ProductsService } from "./products.service";
import {
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { ProductsPostDto } from "./dto/products.post.dto";
import { ProductsUpdateDto } from "./dto/products.update.dto";
import { Roles } from "../../auth/roles.decorator";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { products } from "../../database/schemas";
import { BaseCrudController } from "../../common/base-crud.controller";

@ApiTags("Products")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("products")
export class ProductsController extends BaseCrudController<typeof products> {
  constructor(protected readonly service: ProductsService) {
    super(service, "products", true);
  }

  @Post()
  @ApiBody({ type: ProductsPostDto })
  @ApiOperation({ summary: `Create Products` })
  @ApiResponse({
    status: 201,
    description: `Products created`,
    type: ProductsPostDto,
  })
  async create(@Body() data: ProductsPostDto) {
    return super.create(data);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Products by ID` })
  @ApiResponse({
    status: 200,
    description: `Products retrieved`,
    type: ProductsPostDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Products` })
  @ApiResponse({
    status: 200,
    description: `List of products`,
    type: [ProductsPostDto],
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: "string",
    description: "Page number (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: "string",
    description: "Items per page (default: 10)",
  })
  @ApiQuery({
    name: "q",
    required: false,
    type: "string",
    description: "Search query",
  })
  async list(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("q") search?: string,
    @Query("sort") sort?: string,
    @Query("order") order?: string,
    @Query() allFilters?: Record<string, any>,
  ) {
    return super.list(page, limit, search, sort, order, allFilters);
  }

  @Put(":id")
  @ApiBody({ type: ProductsUpdateDto })
  @ApiOperation({ summary: `Update Products` })
  @ApiResponse({
    status: 201,
    description: `Products updated`,
    type: ProductsUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: ProductsUpdateDto) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Products` })
  @ApiResponse({ status: 200, description: `Products deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
