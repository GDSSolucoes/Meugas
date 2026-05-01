import { BaseEntity } from './BaseEntity';


/**
 * ProductStock Entity
 *
 * Represents a ProductStock record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class ProductStock extends BaseEntity {
  productId: string;
  productName: string;
  sectorId: string;
  sectorName: string;
  quantity: number;
  initialDate: Date;
  static baseUrl: string = "/productStocks";

  /**
   * Static method to filter ProductStock records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<ProductStock[]>
   */
  static async filter(filters: Partial<ProductStock> = {}, pagination = {}) : Promise<ProductStock[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<ProductStock[]>;
  }

  /**:
   * Static method to create a new ProductStock
   *
   * @param data Object with ProductStock properties
   * @returns Promise<ProductStock>
   */
  static async create(data: Partial<ProductStock>): Promise<ProductStock> {
    return super._create.call(this, this.baseUrl, data) as Promise<ProductStock>;
  }

  /**
   * Static method to update a ProductStock
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<ProductStock>
   */
  static async update(id: string, data: Partial<ProductStock>): Promise<ProductStock> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<ProductStock>;
  }

  /**
   * Static method to delete a ProductStock
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a ProductStock by ID
   *
   * @param id The entity ID
   * @returns Promise<ProductStock | null>
   */
  static async findById(id: string): Promise<ProductStock | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<ProductStock | null>;
  }
}
