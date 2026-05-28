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
import { AcquirersService } from "./acquirers.service";
import { acquirers } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AcquirerCreateDto } from "./dto/acquirer.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { AcquirerUpdateDto } from "./dto/acquirer.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("acquirers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("acquirers")
export class AcquirersController extends BaseCrudController<typeof acquirers> {
  constructor(protected readonly service: AcquirersService) {
    super(service, "acquirers", true);
  }

  @Post()
  @ApiBody({ type: AcquirerCreateDto })
  @ApiOperation({ summary: `Create Acquirer` })
  @ApiResponse({
    status: 201,
    description: `Acquirer created`,
    type: AcquirerCreateDto,
  })
  async create(@Body() data: AcquirerCreateDto, @CurrentUser() user: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Acquirer by ID` })
  @ApiResponse({
    status: 200,
    description: `Acquirer retrieved`,
    type: AcquirerCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Acquirers` })
  @ApiResponse({
    status: 200,
    description: `List of acquirers`,
    type: [AcquirerCreateDto],
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
  @ApiBody({ type: AcquirerUpdateDto })
  @ApiOperation({ summary: `Update Acquirer` })
  @ApiResponse({
    status: 201,
    description: `Acquirer updated`,
    type: AcquirerUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: AcquirerUpdateDto) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Acquirer` })
  @ApiResponse({ status: 200, description: `Acquirer deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
