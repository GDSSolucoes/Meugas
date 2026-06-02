import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { BaseCrudService, BasePgTable } from "./base-crud.service";
import { BaseCreateDto } from "./dto/base-create.dto";
import { BaseUpdateDto } from "./dto/base-update.dto";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BaseCrudController<T extends BasePgTable> {
  constructor(
    protected readonly service: BaseCrudService<T>,
    protected readonly entityName: string,
    protected readonly hasCompanyId: boolean = true,
  ) {}

  @Get()
  @ApiOperation({ summary: `List Items` })
  @ApiResponse({ status: 200, description: `list of objects` })
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
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // Remove page, limit e q dos filters se existirem
    const filters = { ...allFilters };
    delete filters.page;
    delete filters.limit;
    delete filters.q;
    delete filters.sort;
    delete filters.order;
    console.log(
      `Listing ${this.entityName} with filters:`,
      filters,
      `search:`,
      search,
      "Pagination: ",
      { page: pageNum, limit: limitNum, sort, order },
    );
    return this.service.list(
      pageNum,
      limitNum,
      filters,
      search,
      sort,
      order === "desc" ? "desc" : "asc",
    );
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Item by ID` })
  @ApiResponse({ status: 200, description: `Item details` })
  async get(@Param("id") id: string) {
    return this.service.get(id);
  }

  @Post()
  @Roles("admin", "user")
  @ApiOperation({ summary: `Create Item` })
  @ApiResponse({ status: 201, description: `Item created` })
  async create(
    @Body()
    data: BaseCreateDto,
    user: any,
  ) {
    data.companyId = user.companyId;
    data.companyName = user.companyName;
    data.createdByName = user.name;
    console.log(`Creating ${this.entityName} with data:`, data);
    return this.service.create(data);
  }

  @Put(":id")
  @Roles("admin", "user")
  @ApiOperation({ summary: `Update Item` })
  @ApiResponse({ status: 200, description: `Item updated` })
  async update(@Param("id") id: string, @Body() data: BaseUpdateDto) {
    console.log(`Updating ${this.entityName} with ID ${id} and data:`, data);
    return this.service.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Item` })
  @ApiResponse({ status: 200, description: `Item deleted` })
  async delete(@Param("id") id: string) {
    console.log(`Deleting ${this.entityName} with ID ${id}`);
    return this.service.delete(id);
  }
}
