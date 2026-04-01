import { BaseEntity } from './BaseEntity';


/**
 * SectorMaster Entity
 *
 * Represents a SectorMaster record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class SectorMaster extends BaseEntity {
  name: string;
  onDelete: any;

  /**
   * Static method to filter SectorMaster records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<SectorMaster[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new SectorMaster
   *
   * @param data Object with SectorMaster properties
   * @returns Promise<SectorMaster>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a SectorMaster
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<SectorMaster>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a SectorMaster
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a SectorMaster by ID
   *
   * @param id The entity ID
   * @returns Promise<SectorMaster | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
