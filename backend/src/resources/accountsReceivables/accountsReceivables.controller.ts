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
import { AccountsReceivablesService } from "./accountsReceivables.service";
import { accountsReceivables } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AccountsReceivablesCreateDto } from "./dto/accountsreceivables.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { AccountsReceivablesUpdateDto } from "./dto/accountsreceivables.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("accountsReceivables")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("accountsReceivables")
export class AccountsReceivablesController extends BaseCrudController<
  typeof accountsReceivables
> {
  constructor(protected readonly service: AccountsReceivablesService) {
    super(service, "accountsReceivables", true);
  }

  @Post()
  @ApiBody({ type: AccountsReceivablesCreateDto })
  @ApiOperation({ summary: `Create AccountsReceivables` })
  @ApiResponse({
    status: 201,
    description: `AccountsReceivables created`,
    type: AccountsReceivablesCreateDto,
  })
  async create(
    @Body() data: AccountsReceivablesCreateDto,
    @CurrentUser() user?: any,
  ) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get AccountsReceivables by ID` })
  @ApiResponse({
    status: 200,
    description: `AccountsReceivables retrieved`,
    type: AccountsReceivablesCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List AccountsReceivables` })
  @ApiResponse({
    status: 200,
    description: `List of accountsReceivables`,
    type: [AccountsReceivablesCreateDto],
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
  @ApiQuery({
    name: "sort",
    required: false,
    type: "string",
    description: "Sort field",
  })
  @ApiQuery({
    name: "order",
    required: false,
    type: "string",
    description: "Sort order",
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
  @ApiBody({ type: AccountsReceivablesUpdateDto })
  @ApiOperation({ summary: `Update AccountsReceivables` })
  @ApiResponse({
    status: 201,
    description: `AccountsReceivables updated`,
    type: AccountsReceivablesUpdateDto,
  })
  async update(
    @Param("id") id: string,
    @Body() data: AccountsReceivablesUpdateDto,
  ) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete AccountsReceivables` })
  @ApiResponse({ status: 200, description: `AccountsReceivables deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
