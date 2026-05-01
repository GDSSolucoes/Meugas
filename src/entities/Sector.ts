import { BaseEntity } from './BaseEntity';


/**
 * Sector Entity
 *
 * Represents a Sector record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Sector extends BaseEntity {
  name: string;
  employeeId: string;
  employeeName: string;
  phone: string;
  isOwnStock: boolean;
  masterSectorId: string;
  masterSectorName: string;
  static baseUrl: string = "/sectors";

  /**
   * Static method to filter Sector records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Sector[]>
   */
  static async filter(filters: Partial<Sector> = {}, pagination = {}) : Promise<Sector[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<Sector[]>;
  }

  /**
   * Static method to create a new Sector
   *
   * @param data Object with Sector properties
   * @returns Promise<Sector>
   */
  static async create(data: Partial<Sector>): Promise<Sector> {
    return super._create.call(this, this.baseUrl, data) as Promise<Sector>;
  }

  /**
   * Static method to update a Sector
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Sector>
   */
  static async update(id: string, data: Partial<Sector>): Promise<Sector> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<Sector>;
  }

  /**
   * Static method to delete a Sector
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a Sector by ID
   *
   * @param id The entity ID
   * @returns Promise<Sector | null>
   */
  static async findById(id: string  ): Promise<Sector | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<Sector | null>;
  }
}
