import { BaseEntity } from './BaseEntity';


export interface BudgetCustomerData {
  name?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface BudgetItemsItem {
  productId?: string;
  productCode?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
}

/**
 * Budget Entity
 *
 * Represents a Budget record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Budget extends BaseEntity {
  budgetNumber: string;
  customerData: BudgetCustomerData;
  items: BudgetItemsItem[];
  totalAmount: number;
  notes: string;
  static baseUrl: string = "/budgets";

  /**
   * Static method to filter Budget records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Budget[]>
   */
  static async filter(filters = {}, pagination = {}) : Promise<Budget[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<Budget[]>;
  }

  /**
   * Static method to create a new Budget
   *
   * @param data Object with Budget properties
   * @returns Promise<Budget>
   */
  static async create(data): Promise<Budget> {
    return super._create.call(this, this.baseUrl, data) as Promise<Budget>;
  }

  /**
   * Static method to update a Budget
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Budget>
   */
  static async update(id, data): Promise<Budget> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<Budget>;
  }

  /**
   * Static method to delete a Budget
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a Budget by ID
   *
   * @param id The entity ID
   * @returns Promise<Budget | null>
   */
  static async findById(id): Promise<Budget | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<Budget | null>;
  }
}
