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
import { PaymenttypEsesService } from "./paymentTypes.service";
import { paymentTypes } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { PaymenttypEsCreateDto } from "./dto/paymenttypes.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { PaymenttypEsUpdateDto } from "./dto/paymenttypes.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("paymentTypes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("paymentTypes")
export class PaymenttypEsesController extends BaseCrudController<
  typeof paymentTypes
> {
  constructor(protected readonly service: PaymenttypEsesService) {
    super(service, "paymentTypes", true);
  }

  @Post()
  @ApiBody({ type: PaymenttypEsCreateDto })
  @ApiOperation({ summary: `Create PaymenttypEs` })
  @ApiResponse({
    status: 201,
    description: `PaymenttypEs created`,
    type: PaymenttypEsCreateDto,
  })
  async create(@Body() data: PaymenttypEsCreateDto, @CurrentUser() user: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get PaymenttypEs by ID` })
  @ApiResponse({
    status: 200,
    description: `PaymenttypEs retrieved`,
    type: PaymenttypEsCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List PaymenttypEses` })
  @ApiResponse({
    status: 200,
    description: `List of paymentTypes`,
    type: [PaymenttypEsCreateDto],
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
  @ApiBody({ type: PaymenttypEsUpdateDto })
  @ApiOperation({ summary: `Update PaymenttypEs` })
  @ApiResponse({
    status: 201,
    description: `PaymenttypEs updated`,
    type: PaymenttypEsUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: PaymenttypEsUpdateDto, @CurrentUser() user: any) {
    return super.update(id, data, user);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete PaymenttypEs` })
  @ApiResponse({ status: 200, description: `PaymenttypEs deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
