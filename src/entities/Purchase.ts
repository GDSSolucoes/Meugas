import { BaseEntity } from './BaseEntity';


export interface PurchaseItemsItem {
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
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
  items: PurchaseItemsItem[];
  totalAmount: number;
  purchaseDate: Date;
  onDelete: any;

  /**
   * Static method to filter Purchase records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Purchase[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new Purchase
   *
   * @param data Object with Purchase properties
   * @returns Promise<Purchase>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a Purchase
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Purchase>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a Purchase
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a Purchase by ID
   *
   * @param id The entity ID
   * @returns Promise<Purchase | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
