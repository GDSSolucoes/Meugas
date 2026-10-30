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
import { SalesService } from "./sales.service";
import { sales } from "../../database/schemas";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { SalesCreateDto } from "./dto/sales.post.dto";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { SalesUpdateDto } from "./dto/sales.update.dto";
import { CurrentUser } from "../../auth/current-user.decorator";
import { SalesFromOrderDto } from "./dto/sales-from-order.dto";

@ApiTags("sales")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "user")
@Controller("sales")
export class SalesController extends BaseCrudController<typeof sales> {
  constructor(protected readonly service: SalesService) {
    super(service, "sales", true);
  }

  @Post()
  @ApiBody({ type: SalesCreateDto })
  @ApiOperation({
    summary: `Criar venda completa (incluindo estoque e financeiro)`,
  })
  @ApiResponse({
    status: 201,
    description: `Sales created`,
    type: SalesCreateDto,
  })
  async create(@Body() data: SalesCreateDto, @CurrentUser() user: any) {
    return this.service.completeCreate(
      data,
      user.id,
      user.name,
      user.companyId,
      user.companyName,
    );
  }

  @Post("from-order")
  @ApiBody({ type: SalesFromOrderDto })
  @ApiOperation({
    summary: "Converter pedido em venda completa, com estoque e financeiro",
  })
  @ApiResponse({ status: 201, description: "Venda do pedido criada" })
  async createFromOrder(
    @Body() data: SalesFromOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createFromOrder(
      data,
      user.id,
      user.name,
      user.companyId,
      user.companyName,
    );
  }

  @Post("complete")
  @ApiBody({ type: SalesCreateDto })
  @ApiOperation({
    summary: `Criar venda completa (incluindo estoque e financeiro)`,
  })
  @ApiResponse({ status: 201, description: `Venda criada` })
  async createComplete(@Body() data: SalesCreateDto, @CurrentUser() user: any) {
    return this.service.completeCreate(
      data,
      user.id,
      user.name,
      user.companyId,
      user.companyName,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: `Get Sales by ID` })
  @ApiResponse({
    status: 200,
    description: `Sales retrieved`,
    type: SalesCreateDto,
  })
  async get(@Param("id") id: string) {
    return super.get(id);
  }

  @Get()
  @ApiOperation({ summary: `List Sales` })
  @ApiResponse({
    status: 200,
    description: `List of sales`,
    type: [SalesCreateDto],
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
  @ApiBody({ type: SalesUpdateDto })
  @ApiOperation({ summary: `Atualizar venda completa (reverte e recria tudo)` })
  @ApiResponse({
    status: 201,
    description: `Sales updated`,
    type: SalesUpdateDto,
  })
  async update(
    @Param("id") id: string,
    @Body() data: SalesUpdateDto,
    @CurrentUser() user: any,
  ) {
    return this.service.completeUpdate(
      id,
      data,
      user.id,
      user.name,
      user.companyId,
      user.companyName,
    );
  }

  @Put("complete/:id")
  @ApiBody({ type: SalesUpdateDto })
  @ApiOperation({ summary: `Atualizar venda completa (reverte e recria tudo)` })
  @ApiResponse({ status: 200, description: `Venda atualizada` })
  async updateComplete(
    @Param("id") id: string,
    @Body() data: SalesUpdateDto,
    @CurrentUser() user: any,
  ) {
    return this.service.completeUpdate(
      id,
      data,
      user.id,
      user.name,
      user.companyId,
      user.companyName,
    );
  }

  @Delete(":id")
  @Roles("admin")
  @ApiOperation({ summary: `Delete Sales` })
  @ApiResponse({ status: 200, description: `Sales deleted` })
  async delete(@Param("id") id: string) {
    return super.delete(id);
  }

  @Get("search/advanced")
  @ApiOperation({
    summary: `Pesquisa avançada de vendas com filtros e totais agregados`,
  })
  @ApiResponse({
    status: 200,
    description: `Lista paginada de vendas com totais`,
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: "string",
    description: "Número da página (default: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: "string",
    description: "Itens por página (default: 100)",
  })
  @ApiQuery({
    name: "personId",
    required: false,
    type: "string",
  })
  @ApiQuery({
    name: "personTypes",
    required: false,
    type: "string",
    isArray: true,
    description: "Array de tipos de pessoa (cliente, ponto_venda)",
  })
  @ApiQuery({
    name: "sectorId",
    required: false,
    type: "string",
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: "string",
    description: "Data inicial (YYYY-MM-DD)",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: "string",
    description: "Data final (YYYY-MM-DD)",
  })
  @ApiQuery({
    name: "sort",
    required: false,
    type: "string",
  })
  @ApiQuery({
    name: "order",
    required: false,
    type: "string",
    description: "asc ou desc",
  })
  @ApiQuery({
    name: "q",
    required: false,
    type: "string",
    description: "Termo de busca",
  })
  async search(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("personId") personId?: string,
    @Query("personTypes") personTypes?: string | string[],
    @Query("sectorId") sectorId?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("sort") sort?: string,
    @Query("order") order?: string,
    @Query("q") q?: string,
  ) {
    const personTypesArray: string[] = [];
    if (personTypes) {
      if (Array.isArray(personTypes)) {
        personTypesArray.push(...personTypes);
      } else {
        personTypesArray.push(
          ...personTypes.split(",").map((t) => t.trim()),
        );
      }
    }

    return this.service.search({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 100,
      personId,
      personTypes: personTypesArray.length > 0 ? personTypesArray : undefined,
      sectorId,
      startDate,
      endDate,
      sort,
      order: order === "asc" ? "asc" : "desc",
      q,
    });
  }
}
