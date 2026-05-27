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
import { AccountsreceivablEsesService } from "./accountsReceivables.service";
import { accountsReceivables } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AccountsreceivablEsCreateDto } from "./dto/accountsreceivables.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { AccountsreceivablEsUpdateDto } from "./dto/accountsreceivables.update.dto";

@ApiTags("accountsReceivables")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("accountsReceivables")
export class AccountsreceivablEsesController extends BaseCrudController<
  typeof accountsReceivables
> {
  constructor(protected readonly service: AccountsreceivablEsesService) {
    super(service, "accountsReceivables", true);
  }

  @Post()
  @ApiBody({ type: AccountsreceivablEsCreateDto })
  @ApiOperation({ summary: `Create AccountsreceivablEs` })
  @ApiResponse({
    status: 201,
    description: `AccountsreceivablEs created`,
    type: AccountsreceivablEsCreateDto,
  })
  async create(@Body() data: AccountsreceivablEsCreateDto) {
    return super.create(data);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get AccountsreceivablEs by ID` })
  @ApiResponse({
    status: 200,
    description: `AccountsreceivablEs retrieved`,
    type: AccountsreceivablEsCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List AccountsreceivablEses` })
  @ApiResponse({
    status: 200,
    description: `List of accountsReceivables`,
    type: [AccountsreceivablEsCreateDto],
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
  @ApiBody({ type: AccountsreceivablEsUpdateDto })
  @ApiOperation({ summary: `Update AccountsreceivablEs` })
  @ApiResponse({
    status: 201,
    description: `AccountsreceivablEs updated`,
    type: AccountsreceivablEsUpdateDto,
  })
  async update(
    @Param("id") id: string,
    @Body() data: AccountsreceivablEsUpdateDto,
  ) {
    return super.update(id, data);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete AccountsreceivablEs` })
  @ApiResponse({ status: 200, description: `AccountsreceivablEs deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
