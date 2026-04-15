import { BaseEntity } from './BaseEntity';


export enum FinancialGroupTypeEnum {
  RECEITA = "receita",
  DESPESA = "despesa",
  MOVIMENTACAO = "movimentacao",
  INVESTIMENTO = "investimento",
}

/**
 * FinancialGroup Entity
 *
 * Represents a FinancialGroup record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class FinancialGroups extends BaseEntity {
  name: string;
  type: FinancialGroupTypeEnum;
  description: string;
  onDelete: any;
  active: boolean;

  /**
   * Static method to filter FinancialGroup records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<FinancialGroup[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new FinancialGroup
   *
   * @param data Object with FinancialGroup properties
   * @returns Promise<FinancialGroup>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a FinancialGroup
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<FinancialGroup>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a FinancialGroup
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a FinancialGroup by ID
   *
   * @param id The entity ID
   * @returns Promise<FinancialGroup | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
