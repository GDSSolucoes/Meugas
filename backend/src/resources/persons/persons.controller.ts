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
import { PersonsService } from "./persons.service";
import { persons } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { PersonCreateDto } from "./dto/person.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { PersonUpdateDto } from "./dto/person.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("persons")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("persons")
export class PersonsController extends BaseCrudController<typeof persons> {
  constructor(protected readonly service: PersonsService) {
    super(service, "persons", true);
  }

  @Post()
  @ApiBody({ type: PersonCreateDto })
  @ApiOperation({ summary: `Create Person` })
  @ApiResponse({
    status: 201,
    description: `Person created`,
    type: PersonCreateDto,
  })
  async create(@Body() data: PersonCreateDto, @CurrentUser() user: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Person by ID` })
  @ApiResponse({
    status: 200,
    description: `Person retrieved`,
    type: PersonCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Persons` })
  @ApiResponse({
    status: 200,
    description: `List of persons`,
    type: [PersonCreateDto],
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
  @ApiBody({ type: PersonUpdateDto })
  @ApiOperation({ summary: `Update Person` })
  @ApiResponse({
    status: 201,
    description: `Person updated`,
    type: PersonUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: PersonUpdateDto, @CurrentUser() user: any) {
    return super.update(id, data, user);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Person` })
  @ApiResponse({ status: 200, description: `Person deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
