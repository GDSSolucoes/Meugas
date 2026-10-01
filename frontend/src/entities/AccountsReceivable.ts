import { BaseEntity } from './BaseEntity';
import { api } from '@/api/apiClient';


export enum AccountsReceivableStatusEnum {
  PENDENTE = "pendente",
  PAGO = "pago",
  VENCIDO = "vencido",
}

/**
 * AccountsReceivable Entity
 *
 * Represents a AccountsReceivable record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class AccountsReceivable extends BaseEntity {
  personId: string;
  personName: string;
  installmentNumber: number;
  description: string;
  dueDate: Date;
  amount: number;
  paymentDate: Date;
  saleId: string;
  status: AccountsReceivableStatusEnum;
  sectorId: string;
  sectorName: string;
  renegociacaoOrigem: string;
  renegociacaoData: Date;
  renegociacaoObservacao: string;
  paymentTypeId: string;
  paymentTypeName: string;

  static baseUrl: string = "/accountsReceivables";


  constructor(data?: Partial<AccountsReceivable>) {
    super(data);
  }


  /**
   * Static method to filter AccountsReceivable records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<AccountsReceivable[]>
   */
  static async filter(filters = {}, pagination = {}) : Promise<AccountsReceivable[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<AccountsReceivable[]>;
  }

  /**
   * Static method to create a new AccountsReceivable
   *
   * @param data Object with AccountsReceivable properties
   * @returns Promise<AccountsReceivable>
   */
  static async create(data): Promise<AccountsReceivable> {
    return super._create.call(this, this.baseUrl, data) as Promise<AccountsReceivable>;
  }

  /**
   * Static method to update a AccountsReceivable
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<AccountsReceivable>
   */
  static async update(id, data): Promise<AccountsReceivable> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<AccountsReceivable>;
  }

  /**
   * Static method to delete a AccountsReceivable
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a AccountsReceivable by ID
   *
   * @param id The entity ID
   * @returns Promise<AccountsReceivable | null>
   */
  static async findById(id): Promise<AccountsReceivable | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<AccountsReceivable | null>;
  }

  /**
   * Static method to register payment for accounts receivable
   * @param data - Data with accountReceivableIds, cashAccountId, paymentDate
   * @returns Promise<any>
   */
  static async registerPayment(data: {
    accountReceivableIds: string[];
    cashAccountId: string;
    paymentDate: string;
  }): Promise<any> {
    const response = await api.post(`${this.baseUrl}/register-payment`, data);
    return response.data;
  }

  /**
   * Static method to list Accounts Receivable with filters and aggregated totals.
   *
   * Uses the standard list() endpoint (overridden on backend) which returns
   * paginated data plus aggregated totals (totalReceivable, totalPaid,
   * totalPending, totalOverdue) in the same envelope.
   *
   * @param filters Filters (supports dueDate_gte, dueDate_lte, createdAt_gte,
   *                createdAt_lte, personId, status, etc.)
   * @param pagination Pagination / sort options
   * @returns Promise with paginated data + 4 aggregated totals
   */
  static async searchWithTotals(
    filters: Record<string, any> = {},
    pagination: {
      page?: number;
      limit?: number;
      q?: string;
      sort?: string;
      order?: "asc" | "desc";
    } = {},
  ): Promise<{
    data: AccountsReceivable[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    totalReceivable: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
  }> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(key, String(item)));
        } else {
          params.append(key, String(value));
        }
      }
    });

    if (pagination.page) params.append("page", String(pagination.page));
    if (pagination.limit) params.append("limit", String(pagination.limit));
    if (pagination.q) params.append("q", pagination.q);
    if (pagination.sort) {
      params.append("sort", pagination.sort.replace("-", ""));
    }
    if (pagination.order || pagination.sort?.startsWith("-")) {
      params.append(
        "order",
        pagination.sort?.startsWith("-") ? "desc" : pagination.order ?? "asc",
      );
    }

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await api.get(url);
    const result = response.data;

    return {
      data: result?.data
        ? result.data.map((item: any) => new this(item))
        : [],
      total: Number(result?.total || 0),
      page: Number(result?.page || 1),
      limit: Number(result?.limit || 100),
      totalPages: Number(result?.totalPages || 0),
      totalReceivable: Number(result?.totalReceivable || 0),
      totalPaid: Number(result?.totalPaid || 0),
      totalPending: Number(result?.totalPending || 0),
      totalOverdue: Number(result?.totalOverdue || 0),
    };
  }
}
