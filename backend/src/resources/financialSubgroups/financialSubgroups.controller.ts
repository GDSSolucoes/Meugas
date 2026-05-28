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
import { FinancialsubgroupsService } from "./financialSubgroups.service";
import { financialSubgroups } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { FinancialsubgroupCreateDto } from "./dto/financialsubgroup.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { FinancialsubgroupUpdateDto } from "./dto/financialsubgroup.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("financialSubgroups")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("financialSubgroups")
export class FinancialsubgroupsController extends BaseCrudController<
  typeof financialSubgroups
> {
  constructor(protected readonly service: FinancialsubgroupsService) {
    super(service, "financialSubgroups", true);
  }

  @Post()
  @ApiBody({ type: FinancialsubgroupCreateDto })
  @ApiOperation({ summary: `Create Financialsubgroup` })
  @ApiResponse({
    status: 201,
    description: `Financialsubgroup created`,
    type: FinancialsubgroupCreateDto,
  })
  async create(
    @Body() data: FinancialsubgroupCreateDto,
    @CurrentUser() user: any,
  ) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Financialsubgroup by ID` })
  @ApiResponse({
    status: 200,
    description: `Financialsubgroup retrieved`,
    type: FinancialsubgroupCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Financialsubgroups` })
  @ApiResponse({
    status: 200,
    description: `List of financialSubgroups`,
    type: [FinancialsubgroupCreateDto],
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
  @ApiBody({ type: FinancialsubgroupUpdateDto })
  @ApiOperation({ summary: `Update Financialsubgroup` })
  @ApiResponse({
    status: 201,
    description: `Financialsubgroup updated`,
    type: FinancialsubgroupUpdateDto,
  })
  async update(
    @Param("id") id: string,
    @Body() data: FinancialsubgroupUpdateDto,
  ) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Financialsubgroup` })
  @ApiResponse({ status: 200, description: `Financialsubgroup deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
