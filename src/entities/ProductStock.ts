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
  onDelete: any;

  /**
   * Static method to filter ProductStock records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<ProductStock[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new ProductStock
   *
   * @param data Object with ProductStock properties
   * @returns Promise<ProductStock>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a ProductStock
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<ProductStock>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a ProductStock
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a ProductStock by ID
   *
   * @param id The entity ID
   * @returns Promise<ProductStock | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
