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
export class FinancialGroup extends BaseEntity {
  name: string;
  type: FinancialGroupTypeEnum;
  description: string;
  static baseUrl: string = "/financialGroups";

  /**
   * Static method to filter FinancialGroup records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<FinancialGroup[]>
   */
  static async filter(filters: Partial<FinancialGroup> = {}, pagination = {}) : Promise<FinancialGroup[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<FinancialGroup[]>;
  }

  /**
   * Static method to create a new FinancialGroup
   *
   * @param data Object with FinancialGroup properties
   * @returns Promise<FinancialGroup>
   */
  static async create(data: Partial<FinancialGroup>): Promise<FinancialGroup> {
    return super._create.call(this, this.baseUrl, data) as Promise<FinancialGroup>;
  }

  /**
   * Static method to update a FinancialGroup
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<FinancialGroup>
   */
  static async update(id: string, data: Partial<FinancialGroup>): Promise<FinancialGroup> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<FinancialGroup>;
  }

  /**
   * Static method to delete a FinancialGroup
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a FinancialGroup by ID
   *
   * @param id The entity ID
   * @returns Promise<FinancialGroup | null>
   */
  static async findById(id: string): Promise<FinancialGroup | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<FinancialGroup | null>;
  }
}
