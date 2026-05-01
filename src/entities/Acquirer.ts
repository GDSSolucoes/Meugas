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

  static baseUrl: string = "/acquirers";

  /**
   * Static method to filter Acquirer records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Acquirer[]>
   */
  static async filter(filters = {}, pagination = {}) : Promise<Acquirer[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<Acquirer[]>;
  }

  /**
   * Static method to create a new Acquirer
   *
   * @param data Object with Acquirer properties
   * @returns Promise<Acquirer>
   */
  static async create(data): Promise<Acquirer> {
    return super._create.call(this, this.baseUrl, data) as Promise<Acquirer>;
  }

  /**
   * Static method to update a Acquirer
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Acquirer>
   */
  static async update(id, data): Promise<Acquirer> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<Acquirer>;
  }

  /**
   * Static method to delete a Acquirer
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a Acquirer by ID
   *
   * @param id The entity ID
   * @returns Promise<Acquirer | null>
   */
  static async findById(id): Promise<Acquirer | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<Acquirer | null>;
  }
}
