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
import { OrdersService } from "./orders.service";
import { orders } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { OrderCreateDto } from "./dto/order.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { OrderUpdateDto } from "./dto/order.update.dto";

@ApiTags("orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("orders")
export class OrdersController extends BaseCrudController<typeof orders> {
  constructor(protected readonly service: OrdersService) {
    super(service, "orders", true);
  }

  @Post()
  @ApiBody({ type: OrderCreateDto })
  @ApiOperation({ summary: `Create Order` })
  @ApiResponse({
    status: 201,
    description: `Order created`,
    type: OrderCreateDto,
  })
  async create(@Body() data: OrderCreateDto) {
    return super.create(data);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Order by ID` })
  @ApiResponse({
    status: 200,
    description: `Order retrieved`,
    type: OrderCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Orders` })
  @ApiResponse({
    status: 200,
    description: `List of orders`,
    type: [OrderCreateDto],
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
  @ApiBody({ type: OrderUpdateDto })
  @ApiOperation({ summary: `Update Order` })
  @ApiResponse({
    status: 201,
    description: `Order updated`,
    type: OrderUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: OrderUpdateDto) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Order` })
  @ApiResponse({ status: 200, description: `Order deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
