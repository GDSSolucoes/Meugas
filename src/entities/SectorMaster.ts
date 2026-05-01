import { BaseEntity } from './BaseEntity';


/**
 * SectorMaster Entity
 *
 * Represents a SectorMaster record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class SectorMaster extends BaseEntity {
  name: string;
  static baseUrl: string = "/sectorMasters";

  /**
   * Static method to filter SectorMaster records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<SectorMaster[]>
   */
  static async filter(filters: Partial<SectorMaster> = {}, pagination = {}) : Promise<SectorMaster[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<SectorMaster[]>;
  }

  /**
   * Static method to create a new SectorMaster
   *
   * @param data Object with SectorMaster properties
   * @returns Promise<SectorMaster>
   */
  static async create(data: Partial<SectorMaster>): Promise<SectorMaster> {
    return super._create.call(this, this.baseUrl, data) as Promise<SectorMaster>;
  }

  /**
   * Static method to update a SectorMaster
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<SectorMaster>
   */
  static async update(id: string, data: Partial<SectorMaster>): Promise<SectorMaster> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<SectorMaster>;
  }

  /**
   * Static method to delete a SectorMaster
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a SectorMaster by ID
   *
   * @param id The entity ID
   * @returns Promise<SectorMaster | null>
   */
  static async findById(id: string): Promise<SectorMaster | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<SectorMaster | null>;
  }
}
