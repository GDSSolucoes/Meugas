import { BaseEntity } from "./BaseEntity";

export interface PurchaseItemsItem {
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}

export interface InstallmentDetail {
  number?: number;
  dueDate?: string;
  amount?: number;
  status?: string;
}

/**
 * Purchase Entity
 *
 * Represents a Purchase record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Purchase extends BaseEntity {
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  nfeNumber?: string;
  sectorId: string;
  sectorName: string;
  cashAccountId?: string;
  cashAccountName?: string;
  items: PurchaseItemsItem[];
  totalAmount: number;
  purchaseDate: Date;
  paymentTypeId?: string;
  paymentTypeName?: string;
  installments?: number;
  installmentsDetails?: InstallmentDetail[];

  static baseUrl: string = "/purchases";

  /**
   * Static method to filter Purchase records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Purchase[]>
   */
  static async filter(
    filters: Partial<Purchase> = {},
    pagination = {},
  ): Promise<Purchase[]> {
    return super._filter.call(
      this,
      this.baseUrl,
      filters,
      pagination,
    ) as Promise<Purchase[]>;
  }

  /**
   * Static method to create a new Purchase
   *
   * @param data Object with Purchase properties
   * @returns Promise<Purchase>
   */
  static async create(data: Partial<Purchase>): Promise<Purchase> {
    return super._create.call(this, this.baseUrl, data) as Promise<Purchase>;
  }

  /**
   * Static method to update a Purchase
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Purchase>
   */
  static async update(id: string, data: Partial<Purchase>): Promise<Purchase> {
    return super._update.call(
      this,
      this.baseUrl,
      id,
      data,
    ) as Promise<Purchase>;
  }

  /**
   * Static method to delete a Purchase
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a Purchase by ID
   *
   * @param id The entity ID
   * @returns Promise<Purchase | null>
   */
  static async findById(id: string): Promise<Purchase | null> {
    return super._findById.call(
      this,
      this.baseUrl,
      id,
    ) as Promise<Purchase | null>;
  }
}
