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
import { SalEsesService } from "./sales.service";
import { sales } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { SalEsCreateDto } from "./dto/sales.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { SalEsUpdateDto } from "./dto/sales.update.dto";

@ApiTags("sales")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("sales")
export class SalEsesController extends BaseCrudController<typeof sales> {
  constructor(protected readonly service: SalEsesService) {
    super(service, "sales", true);
  }

  @Post()
  @ApiBody({ type: SalEsCreateDto })
  @ApiOperation({ summary: `Create SalEs` })
  @ApiResponse({
    status: 201,
    description: `SalEs created`,
    type: SalEsCreateDto,
  })
  async create(@Body() data: SalEsCreateDto) {
    return super.create(data);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get SalEs by ID` })
  @ApiResponse({
    status: 200,
    description: `SalEs retrieved`,
    type: SalEsCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List SalEses` })
  @ApiResponse({
    status: 200,
    description: `List of sales`,
    type: [SalEsCreateDto],
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
  @ApiBody({ type: SalEsUpdateDto })
  @ApiOperation({ summary: `Update SalEs` })
  @ApiResponse({
    status: 201,
    description: `SalEs updated`,
    type: SalEsUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: SalEsUpdateDto) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete SalEs` })
  @ApiResponse({ status: 200, description: `SalEs deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
