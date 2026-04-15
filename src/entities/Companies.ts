import { BaseEntity } from './BaseEntity';


/**
 * Companie Entity
 *
 * Represents a Companie record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Companies extends BaseEntity {
  // No properties defined yet

  /**
   * Static method to filter Companie records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Companie[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new Companie
   *
   * @param data Object with Companie properties
   * @returns Promise<Companie>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a Companie
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Companie>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a Companie
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a Companie by ID
   *
   * @param id The entity ID
   * @returns Promise<Companie | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
