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
  role!: string;
  userType!: userTypeEnum;
  phone?: string;
  department?: string;
  deleted?: boolean;
  static baseUrl: string = "/users";

  constructor(data?: Partial<User>) {
    super(data);
  }

  static async me(this: new (data?: any) => User) {
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
