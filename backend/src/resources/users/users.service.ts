import { Inject, Injectable } from "@nestjs/common";
import { BaseCrudService } from "../../common/base-crud.service";
import { RequestContextService } from "../../database/request-context.service";
import { UserCreateDto } from "./dto/user.post.dto";
import { eq } from "drizzle-orm";
import { UserRoleEnum, users, UserTypeEnum } from "../../database/schemas";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { UserUpdateDto } from "./dto/user.update.dto";
import { UserBaseDto } from "./dto/user.base.dto";

@Injectable()
export class UsersService extends BaseCrudService<typeof users> {
  constructor(
    @Inject("DB") private readonly db: NodePgDatabase,
    requestContext: RequestContextService,
  ) {
    super(requestContext, users, true); // hasCompanyId = true
  }

  async findByEmail(email: string) {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return rows[0] || null;
  }

  async findByCpf(cpf: string) {
    const rows = await this.db.select().from(users).where(eq(users.cpf, cpf));
    return rows[0] || null;
  }

  async findById(id: string) {
    const rows = await this.db.select().from(users).where(eq(users.id, id));
    return rows[0] || null;
  }

  async validatePassword(hash: string, password: string) {
    return bcrypt.compare(password, hash);
  }

  async createNew(data: UserCreateDto, createdBy: any) {
    const db = this.getDb();
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(data.password, 10);

    if (createdBy.userType !== UserTypeEnum.SUPER_ADMIN) {
      if (data.companyId !== createdBy.companyId) {
        throw new Error(
          `Usuários administradores normais só podem criar usuários para sua própria empresa. Sua empresa: ${createdBy.companyId}`,
        );
      }
    }
    // Super_admin pode criar para qualquer empresa

    return await super.create({
      id,
      ...data,
      role: data.role || UserRoleEnum.USER,
      userType: data.userType || UserTypeEnum.ATENDENTE,
      passwordHash,
      active: true,
    } as UserBaseDto);
  }

  async countAll() {
    const rows = await this.getDb().select({}).from(users);
    return rows.length;
  }

  async listAll() {
    const db = this.getDb();
    const rows = await db
      .select({
        usersId: users.id,
        name: users.name,
        email: users.email,
        cpf: users.cpf,
        userType: users.userType,
        role: users.role,
        phone: users.phone,
        department: users.department,
        createdAt: users.createdAt,
        companyId: users.companyId,
        companyName: users.companyName,
        active: users.active,
      })
      .from(users);
    return rows;
  }

  async update(id: string, data: Partial<UserUpdateDto>) {
    const patch: any = {
      ...data,
    };
    if (data.password) {
      patch.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return await super.update(id, patch);
  }
}
