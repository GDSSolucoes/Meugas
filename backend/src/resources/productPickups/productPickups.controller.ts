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
import { ProductpickupsService } from "./productPickups.service";
import { productPickups } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { ProductpickupCreateDto } from "./dto/productpickup.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { ProductpickupUpdateDto } from "./dto/productpickup.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";

@ApiTags("productPickups")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("productPickups")
export class ProductpickupsController extends BaseCrudController<
  typeof productPickups
> {
  constructor(protected readonly service: ProductpickupsService) {
    super(service, "productPickups", true);
  }

  @Post()
  @ApiBody({ type: ProductpickupCreateDto })
  @ApiOperation({ summary: `Create Productpickup` })
  @ApiResponse({
    status: 201,
    description: `Productpickup created`,
    type: ProductpickupCreateDto,
  })
  async create(@Body() data: ProductpickupCreateDto, @CurrentUser() user: any) {
    return super.create(data, user);
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Productpickup by ID` })
  @ApiResponse({
    status: 200,
    description: `Productpickup retrieved`,
    type: ProductpickupCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Productpickups` })
  @ApiResponse({
    status: 200,
    description: `List of productPickups`,
    type: [ProductpickupCreateDto],
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
  @ApiBody({ type: ProductpickupUpdateDto })
  @ApiOperation({ summary: `Update Productpickup` })
  @ApiResponse({
    status: 201,
    description: `Productpickup updated`,
    type: ProductpickupUpdateDto,
  })
  async update(@Param("id") id: string, @Body() data: ProductpickupUpdateDto, @CurrentUser() user: any) {
    return super.update(id, data, user);
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Productpickup` })
  @ApiResponse({ status: 200, description: `Productpickup deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }
}
