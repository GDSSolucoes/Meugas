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
export class Sales extends BaseEntity {
  saleNumber: string;
  onDelete: any;
  personName: string;
  sectorName: string;
  status: SaleStatusEnum;
  saleDate: Date;
  items: SaleItemsItem[];
  paymentMethods: SalePaymentMethodsItem[];
  totalAmount: number;
  notes: string;
  orderNumber: string;
  conveniadaId: string;
  conveniadaName: string;
  nfeNumber: string;
  nfeKey: string;
  nfeDate: Date;
  nfeCancelada: boolean;
  nfeJustificativaCancelamento: string;
  nfceNumber: string;
  nfceKey: string;
  nfceDate: Date;
  nfceCancelada: boolean;
  nfceJustificativaCancelamento: string;

  /**
   * Static method to filter Sale records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Sale[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new Sale
   *
   * @param data Object with Sale properties
   * @returns Promise<Sale>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a Sale
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Sale>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a Sale
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a Sale by ID
   *
   * @param id The entity ID
   * @returns Promise<Sale | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
