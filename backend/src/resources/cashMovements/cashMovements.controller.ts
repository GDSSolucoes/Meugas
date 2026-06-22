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
import { CashmovementsService } from "./cashMovements.service";
import { cashMovements } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { CashmovementCreateDto } from "./dto/cashmovement.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { CashmovementUpdateDto } from "./dto/cashmovement.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("cashMovements")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("cashMovements")
export class CashmovementsController extends BaseCrudController<
  typeof cashMovements
> {
  constructor(protected readonly service: CashmovementsService) {
    super(service, "cashMovements", true);
  }

  @Post()
  @ApiBody({ type: CashmovementCreateDto })
  @ApiOperation({ summary: `Create Cashmovement` })
  @ApiResponse({
    status: 201,
    description: `Cashmovement created`,
    type: CashmovementCreateDto,
  })
  async create(@Body() data: CashmovementCreateDto, @CurrentUser() user?: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Cashmovement by ID` })
  @ApiResponse({
    status: 200,
    description: `Cashmovement retrieved`,
    type: CashmovementCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Cashmovements` })
  @ApiResponse({
    status: 200,
    description: `List of cashMovements`,
    type: [CashmovementCreateDto],
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
  @ApiBody({ type: CashmovementUpdateDto })
  @ApiOperation({ summary: `Update Cashmovement` })
  @ApiResponse({
    status: 201,
    description: `Cashmovement updated`,
    type: CashmovementUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: CashmovementUpdateDto, @CurrentUser() user: any) {
    return super.update(id, data, user);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Cashmovement` })
  @ApiResponse({ status: 200, description: `Cashmovement deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
