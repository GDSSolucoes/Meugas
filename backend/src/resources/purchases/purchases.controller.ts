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
import { PurchasEsesService } from "./purchases.service";
import { purchases } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { PurchasEsCreateDto } from "./dto/purchases.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { PurchasEsUpdateDto } from "./dto/purchases.update.dto";

@ApiTags("purchases")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("purchases")
export class PurchasEsesController extends BaseCrudController<
  typeof purchases
> {
  constructor(protected readonly service: PurchasEsesService) {
    super(service, "purchases", true);
  }

  @Post()
  @ApiBody({ type: PurchasEsCreateDto })
  @ApiOperation({ summary: `Create PurchasEs` })
  @ApiResponse({
    status: 201,
    description: `PurchasEs created`,
    type: PurchasEsCreateDto,
  })
  async create(@Body() data: PurchasEsCreateDto) {
    return super.create(data);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get PurchasEs by ID` })
  @ApiResponse({
    status: 200,
    description: `PurchasEs retrieved`,
    type: PurchasEsCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List PurchasEses` })
  @ApiResponse({
    status: 200,
    description: `List of purchases`,
    type: [PurchasEsCreateDto],
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
  @ApiBody({ type: PurchasEsUpdateDto })
  @ApiOperation({ summary: `Update PurchasEs` })
  @ApiResponse({
    status: 201,
    description: `PurchasEs updated`,
    type: PurchasEsUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: PurchasEsUpdateDto) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete PurchasEs` })
  @ApiResponse({ status: 200, description: `PurchasEs deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
