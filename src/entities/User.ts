import { api } from "@/api/apiClient";
import { BaseEntity } from "./BaseEntity";

export enum userRoleEnum {
  ADMIN = "admin",
  USER = "user",
}

export enum userTypeEnum {
  ATENDENTE = "atendente",
  ADMIN = "admin",
  SUPER_ADMIN = "superAdmin",
}

export class User extends BaseEntity {
  email!: string;
  cpf?: string | null;
  name!: string;
  companyId!: number;
  role!: string;
  active!: boolean;
  userType!: userTypeEnum;
  phone?: string;
  department?: string;
  deleted?: boolean;

  constructor(data?: Partial<User>) {
    super(data);
  }

  static async me(this: new (data?: any) => User) {
    const r = await api.get(`/api/auth/me`);
    return new this(r.data);    
  }

  static async logout() {}
}
