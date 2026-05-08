import { BaseEntity } from './BaseEntity';


/**
 * StockTransfers Entity
 *
 * Represents a StockTransfers record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class StockTransfer extends BaseEntity {
  transferNumber: string;
  productId: string;
  productName: string;
  fromSectorId: string;
  fromSectorName: string;
  toSectorId: string;
  toSectorName: string;
  quantity: number;
  transferDate: Date;
  notes?: string;
  static baseUrl: string = '/stockTransfers';

  /**
   * Static method to filter StockTransfers records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<StockTransfers[]>
   */
  static async filter(filters: Partial<StockTransfer> = {}, pagination = {}) : Promise<StockTransfer[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<StockTransfer[]>;
  }

  /**
   * Static method to create a new StockTransfers
   *
   * @param data Object with StockTransfers properties
   * @returns Promise<StockTransfers>
   */
  static async create(data: Partial<StockTransfer>): Promise<StockTransfer> {
    return super._create.call(this, this.baseUrl, data) as Promise<StockTransfer>;
  }

  /**
   * Static method to update a StockTransfers
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<StockTransfers>
   */
  static async update(id: string, data: Partial<StockTransfer>): Promise<StockTransfer> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<StockTransfer>;
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
  static async findById(id: string): Promise<StockTransfer | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<StockTransfer | null>;
  }
}
