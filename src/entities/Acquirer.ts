import { BaseEntity } from './BaseEntity';


/**
 * Acquirer Entity
 *
 * Represents a Acquirer record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Acquirer extends BaseEntity {
  name: string;
  feePercentage: number;
  settlementDays: number;
  onDelete: any;
  active: boolean;

  /**
   * Static method to filter Acquirer records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Acquirer[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new Acquirer
   *
   * @param data Object with Acquirer properties
   * @returns Promise<Acquirer>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a Acquirer
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Acquirer>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a Acquirer
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a Acquirer by ID
   *
   * @param id The entity ID
   * @returns Promise<Acquirer | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
