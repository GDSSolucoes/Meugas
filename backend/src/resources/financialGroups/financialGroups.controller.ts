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
import { FinancialgroupsService } from "./financialGroups.service";
import { financialGroups } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { FinancialgroupCreateDto } from "./dto/financialgroup.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { FinancialgroupUpdateDto } from "./dto/financialgroup.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("financialGroups")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("financialGroups")
export class FinancialgroupsController extends BaseCrudController<
  typeof financialGroups
> {
  constructor(protected readonly service: FinancialgroupsService) {
    super(service, "financialGroups", true);
  }

  @Post()
  @ApiBody({ type: FinancialgroupCreateDto })
  @ApiOperation({ summary: `Create Financialgroup` })
  @ApiResponse({
    status: 201,
    description: `Financialgroup created`,
    type: FinancialgroupCreateDto,
  })
  async create(
    @Body() data: FinancialgroupCreateDto,
    @CurrentUser() user: any,
  ) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Financialgroup by ID` })
  @ApiResponse({
    status: 200,
    description: `Financialgroup retrieved`,
    type: FinancialgroupCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Financialgroups` })
  @ApiResponse({
    status: 200,
    description: `List of financialGroups`,
    type: [FinancialgroupCreateDto],
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
  @ApiBody({ type: FinancialgroupUpdateDto })
  @ApiOperation({ summary: `Update Financialgroup` })
  @ApiResponse({
    status: 201,
    description: `Financialgroup updated`,
    type: FinancialgroupUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: FinancialgroupUpdateDto) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Financialgroup` })
  @ApiResponse({ status: 200, description: `Financialgroup deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
