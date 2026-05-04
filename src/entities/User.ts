import { api } from "@/api/apiClient";
import { BaseEntity } from "./BaseEntity";
import { StockTransfer } from "./StockTransfer";

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
  
  /**
   * Static method to filter StockTransfers records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<StockTransfers[]>
   */
  static async filter(filters: Partial<User> = {}, pagination = {}) : Promise<User[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<User[]>;
  }

  /**
   * Static method to create a new StockTransfers
   *
   * @param data Object with StockTransfers properties
   * @returns Promise<StockTransfers>
   */
  static async create(data: Partial<User>): Promise<User> {
    return super._create.call(this, this.baseUrl, data) as Promise<User>;
  }

  /**
   * Static method to update a StockTransfers
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<StockTransfers>
   */
  static async update(id: string, data: Partial<User>): Promise<User> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<User>;
  }
  

  /**
   * Static method to update a StockTransfers
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<StockTransfers>
   */
  static async updateMyUserData(id: string, data: Partial<User>): Promise<User> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<User>;
  }


  /**
   * Static method to delete a StockTransfers
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a StockTransfers by ID
   *
   * @param id The entity ID
   * @returns Promise<StockTransfers | null>
   */
  static async findById(id: string): Promise<User | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<User | null>;
  }
}
