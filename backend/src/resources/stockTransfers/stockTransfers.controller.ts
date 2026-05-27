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
import { StocktransfersService } from "./stockTransfers.service";
import { stockTransfers } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { StocktransferCreateDto } from "./dto/stocktransfer.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { StocktransferUpdateDto } from "./dto/stocktransfer.update.dto";

@ApiTags("stockTransfers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("stockTransfers")
export class StocktransfersController extends BaseCrudController<
  typeof stockTransfers
> {
  constructor(protected readonly service: StocktransfersService) {
    super(service, "stockTransfers", true);
  }

  @Post()
  @ApiBody({ type: StocktransferCreateDto })
  @ApiOperation({ summary: `Create Stocktransfer` })
  @ApiResponse({
    status: 201,
    description: `Stocktransfer created`,
    type: StocktransferCreateDto,
  })
  async create(@Body() data: StocktransferCreateDto) {
    return super.create(data);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Stocktransfer by ID` })
  @ApiResponse({
    status: 200,
    description: `Stocktransfer retrieved`,
    type: StocktransferCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Stocktransfers` })
  @ApiResponse({
    status: 200,
    description: `List of stockTransfers`,
    type: [StocktransferCreateDto],
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
  @ApiBody({ type: StocktransferUpdateDto })
  @ApiOperation({ summary: `Update Stocktransfer` })
  @ApiResponse({
    status: 201,
    description: `Stocktransfer updated`,
    type: StocktransferUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: StocktransferUpdateDto) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Stocktransfer` })
  @ApiResponse({ status: 200, description: `Stocktransfer deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
