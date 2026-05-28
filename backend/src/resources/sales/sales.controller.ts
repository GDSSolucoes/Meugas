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
import { SalesService } from "./sales.service";
import { sales } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { SalesCreateDto } from "./dto/sales.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { SalesUpdateDto } from "./dto/sales.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("sales")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("sales")
export class SalesController extends BaseCrudController<typeof sales> {
  constructor(protected readonly service: SalesService) {
    super(service, "sales", true);
  }

  @Post()
  @ApiBody({ type: SalesCreateDto })
  @ApiOperation({ summary: `Create Sales` })
  @ApiResponse({
    status: 201,
    description: `Sales created`,
    type: SalesCreateDto,
  })
  async create(@Body() data: SalesCreateDto, @CurrentUser() user: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Sales by ID` })
  @ApiResponse({
    status: 200,
    description: `Sales retrieved`,
    type: SalesCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Sales` })
  @ApiResponse({
    status: 200,
    description: `List of sales`,
    type: [SalesCreateDto],
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
  @ApiBody({ type: SalesUpdateDto })
  @ApiOperation({ summary: `Update Sales` })
  @ApiResponse({
    status: 201,
    description: `Sales updated`,
    type: SalesUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: SalesUpdateDto) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Sales` })
  @ApiResponse({ status: 200, description: `Sales deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
