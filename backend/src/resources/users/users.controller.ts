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
  BadRequestException,
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
import { UsersService } from "./users.service";
import { users } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { UserCreateDto } from "./dto/user.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { UserUpdateDto } from "./dto/user.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("users")
export class UsersController extends BaseCrudController<typeof users> {
  constructor(protected readonly service: UsersService) {
    super(service, "users", true);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBody({ type: UserCreateDto })
  async create(@CurrentUser() user: any, @Body() body: UserCreateDto) {
    try {
      return await this.service.createNew(body, user);
    } catch (error: any) {
      throw new BadRequestException(error.message || "Erro ao criar usuário");
    }
  }

  @Get(":id")
  @ApiOperation({ summary: `Get User by ID` })
  @ApiResponse({
    status: 200,
    description: `User retrieved`,
    type: UserCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Users` })
  @ApiResponse({
    status: 200,
    description: `List of users`,
    type: [UserCreateDto],
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
  @ApiBody({ type: UserUpdateDto })
  @ApiOperation({ summary: `Update User` })
  @ApiResponse({
    status: 201,
    description: `User updated`,
    type: UserUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: UserUpdateDto, @CurrentUser() user: any) {
    return super.update(id, data, user);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete User` })
  @ApiResponse({ status: 200, description: `User deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
