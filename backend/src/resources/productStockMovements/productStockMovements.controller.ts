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
import { ProductstockmovementsService } from "./productStockMovements.service";
import { productStockMovements } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { ProductstockmovementCreateDto } from "./dto/productstockmovement.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { ProductstockmovementUpdateDto } from "./dto/productstockmovement.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("productStockMovements")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("productStockMovements")
export class ProductstockmovementsController extends BaseCrudController<
  typeof productStockMovements
> {
  constructor(protected readonly service: ProductstockmovementsService) {
    super(service, "productStockMovements", true);
  }

  @Post()
  @ApiBody({ type: ProductstockmovementCreateDto })
  @ApiOperation({ summary: `Create Productstockmovement` })
  @ApiResponse({
    status: 201,
    description: `Productstockmovement created`,
    type: ProductstockmovementCreateDto,
  })
  async create(@Body() data: ProductstockmovementCreateDto, @CurrentUser() user: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Productstockmovement by ID` })
  @ApiResponse({
    status: 200,
    description: `Productstockmovement retrieved`,
    type: ProductstockmovementCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Productstockmovements` })
  @ApiResponse({
    status: 200,
    description: `List of productStockMovements`,
    type: [ProductstockmovementCreateDto],
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
  @ApiBody({ type: ProductstockmovementUpdateDto })
  @ApiOperation({ summary: `Update Productstockmovement` })
  @ApiResponse({
    status: 201,
    description: `Productstockmovement updated`,
    type: ProductstockmovementUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: ProductstockmovementUpdateDto, @CurrentUser() user: any) {
    return super.update(id, data, user);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Productstockmovement` })
  @ApiResponse({ status: 200, description: `Productstockmovement deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
