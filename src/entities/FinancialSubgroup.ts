import { BaseEntity } from './BaseEntity';


/**
 * FinancialSubgroup Entity
 *
 * Represents a FinancialSubgroup record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class FinancialSubgroup extends BaseEntity {
  name: string;
  description?: string;
  financialGroupId: string;
  financialGroupName: string;
  static baseUrl: string = "/financialSubgroups";

  /**
   * Static method to filter FinancialSubgroup records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<FinancialSubgroup[]>
   */
  static async filter(filters: Partial<FinancialSubgroup> = {}, pagination = {}) : Promise<FinancialSubgroup[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<FinancialSubgroup[]>;
  }

  /**
   * Static method to create a new FinancialSubgroup
   *
   * @param data Object with FinancialSubgroup properties
   * @returns Promise<FinancialSubgroup>
   */
  static async create(data: Partial<FinancialSubgroup>): Promise<FinancialSubgroup> {
    return super._create.call(this, this.baseUrl, data) as Promise<FinancialSubgroup>;
  }

  /**
   * Static method to update a FinancialSubgroup
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<FinancialSubgroup>
   */
  static async update(id: string, data: Partial<FinancialSubgroup>): Promise<FinancialSubgroup> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<FinancialSubgroup>;
  }

  /**
   * Static method to delete a FinancialSubgroup
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a FinancialSubgroup by ID
   *
   * @param id The entity ID
   * @returns Promise<FinancialSubgroup | null>
   */
  static async findById(id: string): Promise<FinancialSubgroup | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<FinancialSubgroup | null>;
  }
}
