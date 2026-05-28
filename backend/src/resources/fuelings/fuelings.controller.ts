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
import { FuelingsService } from "./fuelings.service";
import { fuelings } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { FuelingCreateDto } from "./dto/fueling.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { FuelingUpdateDto } from "./dto/fueling.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("fuelings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("fuelings")
export class FuelingsController extends BaseCrudController<typeof fuelings> {
  constructor(protected readonly service: FuelingsService) {
    super(service, "fuelings", true);
  }

  @Post()
  @ApiBody({ type: FuelingCreateDto })
  @ApiOperation({ summary: `Create Fueling` })
  @ApiResponse({
    status: 201,
    description: `Fueling created`,
    type: FuelingCreateDto,
  })
  async create(@Body() data: FuelingCreateDto, @CurrentUser() user: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Fueling by ID` })
  @ApiResponse({
    status: 200,
    description: `Fueling retrieved`,
    type: FuelingCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Fuelings` })
  @ApiResponse({
    status: 200,
    description: `List of fuelings`,
    type: [FuelingCreateDto],
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
  @ApiBody({ type: FuelingUpdateDto })
  @ApiOperation({ summary: `Update Fueling` })
  @ApiResponse({
    status: 201,
    description: `Fueling updated`,
    type: FuelingUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: FuelingUpdateDto) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Fueling` })
  @ApiResponse({ status: 200, description: `Fueling deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
