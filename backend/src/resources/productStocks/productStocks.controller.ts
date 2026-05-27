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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from "@nestjs/swagger";
import { BaseCrudController } from "../../common/base-crud.controller";
import { ProductstocksService } from "./productStocks.service";
import { productStocks } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { ProductstockCreateDto } from "./dto/productstock.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { ProductstockUpdateDto } from "./dto/productstock.update.dto";

@ApiTags("productStocks")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("productStocks")
export class ProductstocksController extends BaseCrudController<
  typeof productStocks
> {
  constructor(protected readonly service: ProductstocksService) {
    super(service, "productStocks", true);
  }

  @Post()
  @ApiBody({ type: ProductstockCreateDto })
  @ApiOperation({ summary: `Create Productstock` })
  @ApiResponse({
    status: 201,
    description: `Productstock created`,
    type: ProductstockCreateDto,
  })
  async create(@Body() data: ProductstockCreateDto) {
    return super.create(data);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Productstock by ID` })
  @ApiResponse({
    status: 200,
    description: `Productstock retrieved`,
    type: ProductstockCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Productstocks` })
  @ApiResponse({
    status: 200,
    description: `List of productStocks`,
    type: [ProductstockCreateDto],
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
  @ApiBody({ type: ProductstockUpdateDto })
  @ApiOperation({ summary: `Update Productstock` })
  @ApiResponse({
    status: 201,
    description: `Productstock updated`,
    type: ProductstockUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: ProductstockUpdateDto) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Productstock` })
  @ApiResponse({ status: 200, description: `Productstock deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
