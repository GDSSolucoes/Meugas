import { BaseEntity } from './BaseEntity';


/**
 * Sector Entity
 *
 * Represents a Sector record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Sectors extends BaseEntity {
  name: string;
  employeeName: string;
  phone: string;
  isOwnStock: boolean;
  masterSectorName: string;
  onDelete: any;
  active: boolean;

  /**
   * Static method to filter Sector records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Sector[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new Sector
   *
   * @param data Object with Sector properties
   * @returns Promise<Sector>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a Sector
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Sector>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a Sector
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a Sector by ID
   *
   * @param id The entity ID
   * @returns Promise<Sector | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
