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
import { VasilhameloansService } from "./vasilhameLoans.service";
import { vasilhameLoans } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { VasilhameloanCreateDto } from "./dto/vasilhameloan.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { VasilhameloanUpdateDto } from "./dto/vasilhameloan.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("vasilhameLoans")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("vasilhameLoans")
export class VasilhameloansController extends BaseCrudController<
  typeof vasilhameLoans
> {
  constructor(protected readonly service: VasilhameloansService) {
    super(service, "vasilhameLoans", true);
  }

  @Post()
  @ApiBody({ type: VasilhameloanCreateDto })
  @ApiOperation({ summary: `Create Vasilhameloan` })
  @ApiResponse({
    status: 201,
    description: `Vasilhameloan created`,
    type: VasilhameloanCreateDto,
  })
  async create(@Body() data: VasilhameloanCreateDto, @CurrentUser() user: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Vasilhameloan by ID` })
  @ApiResponse({
    status: 200,
    description: `Vasilhameloan retrieved`,
    type: VasilhameloanCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Vasilhameloans` })
  @ApiResponse({
    status: 200,
    description: `List of vasilhameLoans`,
    type: [VasilhameloanCreateDto],
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
  @ApiBody({ type: VasilhameloanUpdateDto })
  @ApiOperation({ summary: `Update Vasilhameloan` })
  @ApiResponse({
    status: 201,
    description: `Vasilhameloan updated`,
    type: VasilhameloanUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: VasilhameloanUpdateDto, @CurrentUser() user: any) {
    return super.update(id, data, user);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Vasilhameloan` })
  @ApiResponse({ status: 200, description: `Vasilhameloan deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
