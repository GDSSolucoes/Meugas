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
}
