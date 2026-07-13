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
import { PurchaseitemsService } from "./purchaseItems.service";
import { purchaseItems } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { PurchaseitemCreateDto } from "./dto/purchaseitem.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { PurchaseitemUpdateDto } from "./dto/purchaseitem.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("purchaseItems")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("purchaseItems")
export class PurchaseitemsController extends BaseCrudController<
  typeof purchaseItems
> {
  constructor(protected readonly service: PurchaseitemsService) {
    super(service, "purchaseItems", true);
  }

  @Post()
  @ApiBody({ type: PurchaseitemCreateDto })
  @ApiOperation({ summary: "Create Purchaseitem" })
  @ApiResponse({
    status: 201,
    description: "Purchaseitem created",
    type: PurchaseitemCreateDto,
  })
  async create(@Body() data: PurchaseitemCreateDto, @CurrentUser() user: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get Purchaseitem by ID" })
  @ApiResponse({
    status: 200,
    description: "Purchaseitem retrieved",
    type: PurchaseitemCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: "List Purchaseitems" })
  @ApiResponse({
    status: 200,
    description: "List of purchaseItems",
    type: [PurchaseitemCreateDto],
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
  @ApiBody({ type: PurchaseitemUpdateDto })
  @ApiOperation({ summary: "Update Purchaseitem" })
  @ApiResponse({
    status: 201,
    description: "Purchaseitem updated",
    type: PurchaseitemUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: PurchaseitemUpdateDto, @CurrentUser() user: any) {
    return super.update(id, data, user);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: "Delete Purchaseitem" })
  @ApiResponse({ status: 200, description: "Purchaseitem deleted" })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
