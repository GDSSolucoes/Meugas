import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { ApiTags, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { Roles } from "../../auth/roles.decorator";
import { RolesGuard } from "../../auth/roles.guard";
import { CurrentUser } from "../../auth/current-user.decorator";
import { UsersPostDto } from "./dto/users.post.dto";
import { UsersBootstrapPostDto } from "./dto/users.bootstrap.post.dto";
import { RlsService } from "../../database/rls/rls.service";
import { UserRoleEnum, UserTypeEnum } from "../../database/schemas";
import { CompaniesService } from "../companies/companies.service";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { CompanyPostDto } from "../companies/dto/companies.post.dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly companies: CompaniesService,
    private readonly rls: RlsService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBody({ type: UsersPostDto })
  async create(@CurrentUser() user: any, @Body() body: UsersPostDto) {
    const existing = await this.users.findByEmail(body.email);
    if (existing) return { error: "email_taken" };
    const created = await this.users.create(body);
    return {
      id: created.id,
      email: created.email,
      name: created.name,
      companyId: created.companyId,
      role: created.role,
    };
  }

  @Post("bootstrap-admin")
  @ApiBody({ type: UsersBootstrapPostDto })
  async bootstrapAdmin(@Body() body: UsersBootstrapPostDto) {
    const count = await this.users.countAll();
    if (count > 0) return { error: "already_initialized" };
    const company = await this.companies.create({
      name: `GDS Meu Gás`,
      document: `00000000000000`,
      email: body.email,
      adminName: body.name,
      adminEmail: body.email,
    } as CompanyPostDto);
    const created = await this.rls.withCompany(company.id, () =>
      this.users.create({
        ...body,
        companyId: company.id,
        role: UserRoleEnum.ADMIN,
        userType: UserTypeEnum.SUPER_ADMIN,
      }),
    );
    return {
      id: created.id,
      email: created.email,
      name: created.name,
      companyId: created.companyId,
      role: created.role,
    };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  async list(@CurrentUser() user: any) {
    const rows = await this.users.listAll();
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      companyId: r.companyId,
      active: r.active,
    }));
  }
}
