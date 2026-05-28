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
import { SectorsService } from "./sectors.service";
import { sectors } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { SectorCreateDto } from "./dto/sector.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { SectorUpdateDto } from "./dto/sector.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("sectors")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("sectors")
export class SectorsController extends BaseCrudController<typeof sectors> {
  constructor(protected readonly service: SectorsService) {
    super(service, "sectors", true);
  }

  @Post()
  @ApiBody({ type: SectorCreateDto })
  @ApiOperation({ summary: `Create Sector` })
  @ApiResponse({
    status: 201,
    description: `Sector created`,
    type: SectorCreateDto,
  })
  async create(@Body() data: SectorCreateDto, @CurrentUser() user: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Sector by ID` })
  @ApiResponse({
    status: 200,
    description: `Sector retrieved`,
    type: SectorCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Sectors` })
  @ApiResponse({
    status: 200,
    description: `List of sectors`,
    type: [SectorCreateDto],
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
  @ApiBody({ type: SectorUpdateDto })
  @ApiOperation({ summary: `Update Sector` })
  @ApiResponse({
    status: 201,
    description: `Sector updated`,
    type: SectorUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: SectorUpdateDto) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Sector` })
  @ApiResponse({ status: 200, description: `Sector deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
