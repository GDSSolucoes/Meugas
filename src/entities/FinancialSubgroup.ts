import { BaseEntity } from './BaseEntity';


/**
 * FinancialSubgroup Entity
 *
 * Represents a FinancialSubgroup record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class FinancialSubgroup extends BaseEntity {
  name: string;
  onDelete: any;
  financialGroupName: string;
  active: boolean;

  /**
   * Static method to filter FinancialSubgroup records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<FinancialSubgroup[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new FinancialSubgroup
   *
   * @param data Object with FinancialSubgroup properties
   * @returns Promise<FinancialSubgroup>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a FinancialSubgroup
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<FinancialSubgroup>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a FinancialSubgroup
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a FinancialSubgroup by ID
   *
   * @param id The entity ID
   * @returns Promise<FinancialSubgroup | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
