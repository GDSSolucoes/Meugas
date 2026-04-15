import { BaseEntity } from './BaseEntity';


/**
 * StockTransfer Entity
 *
 * Represents a StockTransfer record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class StockTransfers extends BaseEntity {
  // No properties defined yet

  /**
   * Static method to filter StockTransfer records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<StockTransfer[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new StockTransfer
   *
   * @param data Object with StockTransfer properties
   * @returns Promise<StockTransfer>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a StockTransfer
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<StockTransfer>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a StockTransfer
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a StockTransfer by ID
   *
   * @param id The entity ID
   * @returns Promise<StockTransfer | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
