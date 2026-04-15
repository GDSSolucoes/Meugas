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

export class Users extends BaseEntity {
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

  constructor(data?: Partial<Users>) {
    super(data);
  }

  static async me(this: new (data?: any) => Users) {
    const r = await api.get(`/auth/me`);
    return new this(r.data);    
  }

  static async logout() {
    // Remove tokens from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Redirect to login page
    window.location.href = '/login';
  }
}
