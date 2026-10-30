import { api } from '@/api/apiClient';
import { BaseEntity } from './BaseEntity';



export enum SaleStatusEnum {
  CONCLUIDA = "concluida",
  CANCELADA = "cancelada",
}

export interface SaleItemsItem {
  productId?: string;
  productCode?: string;
  productName?: string;
  category?: string;
  vasilhameId?: string;
  vasilhameName?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  total?: number;
  quantityToPickup?: number;
  vasilhameLoanQuantity?: number;
}

export interface SalePaymentMethodsItem {
  paymentTypeId?: string;
  paymentTypeName?: string;
  amount?: number;
  installments?: number;
  cashAccountId?: string;
  installmentsDetails?: any[];
}

export interface SaleFromOrderPayment {
  paymentTypeId: string;
  amount: number;
  cashAccountId?: string;
  installmentsDetails?: Array<{
    number: number;
    dueDate: string;
    amount: number;
  }>;
}

/**
 * Sale Entity
 *
 * Represents a Sale record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Sale extends BaseEntity {
  saleNumber: string;
  personId: string;
  personName: string;
  sectorId: string;
  sectorName: string;
  status: SaleStatusEnum;
  saleDate: Date;
  items: SaleItemsItem[];
  paymentMethods: SalePaymentMethodsItem[];
  totalAmount: number;
  notes: string;
  orderId: string;
  orderNumber: string;
  conveniadaId: string;
  conveniadaName: string;
  nfeNumber: string;
  nfeKey: string;
  nfeDate: Date;
  nfeCancelada: boolean;
  nfeDataCancelamento: Date;
  nfeJustificativaCancelamento: string;
  nfceNumber: string;
  nfceKey: string;
  nfceDate: Date;
  nfceCancelada: boolean;
  nfceDataCancelamento: Date;
  nfceJustificativaCancelamento: string;
  static baseUrl: string = "/sales";

  /**
   * Static method to filter Sale records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Sale[]>
   */
  static async filter(filters: Partial<Sale> = {}, pagination = {}) : Promise<Sale[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<Sale[]>;
  }

  /**
   * Static method to create a new Sale
   *
   * @param data Object with Sale properties
   * @returns Promise<Sale>
   */
  static async create(data: Partial<Sale>): Promise<Sale> {
    return super._create.call(this, this.baseUrl, data) as Promise<Sale>;
  }

  
  static async createComplete(data: Partial<Sale>) {
    try {
      const response = await api.post(`${this.baseUrl}/complete`, data);
      return response.data;
    } catch (error) {
      console.error("Error creating complete Sale:", error);
      throw error;
    }
  }

  static async createFromOrder(data: {
    orderId: string;
    sectorId: string;
    totalAmount: number;
    paymentMethods: SaleFromOrderPayment[];
  }): Promise<Sale> {
    try {
      const response = await api.post(`${this.baseUrl}/from-order`, data);
      return response.data;
    } catch (error) {
      console.error("Error creating Sale from Order:", error);
      throw error;
    }
  }

  /**
   * Static method to update a Sale
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Sale>
   */
  static async update(id: string, data: Partial<Sale>): Promise<Sale> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<Sale>;
  }

  static async updateComplete(id: string, data: Partial<Sale>) {
    try {
      const response = await api.put(`${this.baseUrl}/complete/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating complete Sale:", error);
      throw error;
    }  
  }

  /**
   * Static method to delete a Sale
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a Sale by ID
   *
   * @param id The entity ID
   * @returns Promise<Sale | null>
   */
  static async findById(id: string): Promise<Sale | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<Sale | null>;
  }

  /**
   * Static method to search Sales with advanced filters and totals
   *
   * @param params Search parameters with filters, pagination, etc.
   * @returns Promise<{ data: Sale[], total: number, page: number, limit: number, totalPages: number, totalRevenue: number, totalSalesCount: number, averageTicket: number }>
   */
  static async searchAdvanced(params: {
    page?: number;
    limit?: number;
    personId?: string;
    personTypes?: string[];
    sectorId?: string;
    startDate?: string;
    endDate?: string;
    sort?: string;
    order?: "asc" | "desc";
    q?: string;
  }): Promise<{
    data: Sale[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    totalRevenue: number;
    totalSalesCount: number;
    averageTicket: number;
  }> {
    try {
      const endpoint = `${this.baseUrl}/search/advanced`;
      const urlParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (Array.isArray(value)) {
            value.forEach((item) => urlParams.append(key, String(item)));
          } else {
            urlParams.append(key, String(value));
          }
        }
      });

      const queryString = urlParams.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;

      const response = await api.get(url);
      const result = response.data;

      return {
        data: result.data
          ? result.data.map((item: any) => new this(item))
          : [],
        total: result.total || 0,
        page: result.page || 1,
        limit: result.limit || 100,
        totalPages: result.totalPages || 0,
        totalRevenue: Number(result.totalRevenue || 0),
        totalSalesCount: Number(result.totalSalesCount || 0),
        averageTicket: Number(result.averageTicket || 0),
      };
    } catch (error) {
      console.error(`Erro ao pesquisar vendas:`, error);
      throw error;
    }
  }
}
