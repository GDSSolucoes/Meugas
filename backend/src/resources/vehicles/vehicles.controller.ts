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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { BaseCrudController } from "../../common/base-crud.controller";
import { VehiclesService } from "./vehicles.service";
import { vehicles } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { VehiclesCreateDto } from "./dto/vehicles.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { VehiclesUpdateDto } from "./dto/vehicles.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("vehicles")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("vehicles")
export class VehiclesController extends BaseCrudController<typeof vehicles> {
  constructor(protected readonly service: VehiclesService) {
    super(service, "vehicles", true);
  }

  @Post()
  @ApiBody({ type: VehiclesCreateDto })
  @ApiOperation({ summary: `Create Vehicle` })
  @ApiResponse({
    status: 201,
    description: `Vehicle created`,
    type: VehiclesCreateDto,
  })
  async create(@Body() data: VehiclesCreateDto, @CurrentUser() user: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Vehicle by ID` })
  @ApiResponse({
    status: 200,
    description: `Vehicle retrieved`,
    type: VehiclesCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Vehicles` })
  @ApiResponse({
    status: 200,
    description: `List of vehicles`,
    type: [VehiclesCreateDto],
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
  @ApiBody({ type: VehiclesUpdateDto })
  @ApiOperation({ summary: `Update Vehicle` })
  @ApiResponse({
    status: 201,
    description: `Vehicle updated`,
    type: VehiclesUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: VehiclesUpdateDto) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Vehicle` })
  @ApiResponse({ status: 200, description: `Vehicle deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
