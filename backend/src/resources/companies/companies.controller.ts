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
import { CompaniesService } from "./companies.service";
import {
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { RolesGuard } from "../../auth/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { CompanyPostDto } from "./dto/companies.post.dto";
import { CompanyUpdateDto } from "./dto/companies.update.dto";
import { companies } from "../../database/schemas";
import { BaseCrudController } from "../../common/base-crud.controller";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("Companies")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("companies")
export class CompaniesController extends BaseCrudController<typeof companies> {
  constructor(protected readonly service: CompaniesService) {
    super(service, "companies", false); // hasCompanyId = false
  }

  @Post()
  @ApiBody({ type: CompanyPostDto })
  @ApiOperation({ summary: `Create Company` })
  @ApiResponse({
    status: 201,
    description: `Company created`,
    type: CompanyPostDto,
  })
  async create(@Body() data: CompanyPostDto, @CurrentUser() user: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Company by ID` })
  @ApiResponse({
    status: 200,
    description: `Company retrieved`,
    type: CompanyPostDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Companies` })
  @ApiResponse({
    status: 200,
    description: `List of companies`,
    type: [CompanyPostDto],
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
  @ApiBody({ type: CompanyUpdateDto })
  @ApiOperation({ summary: `Update Company` })
  @ApiResponse({
    status: 201,
    description: `Company updated`,
    type: CompanyUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: CompanyUpdateDto, @CurrentUser() user: any) {
    return super.update(id, data, user);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Company` })
  @ApiResponse({ status: 200, description: `Company deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
