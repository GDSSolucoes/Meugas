import { BaseEntity } from './BaseEntity';


export enum AccountsReceivableStatusEnum {
  PENDENTE = "pendente",
  PAGO = "pago",
  VENCIDO = "vencido",
}

/**
 * AccountsReceivable Entity
 *
 * Represents a AccountsReceivable record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class AccountsReceivable extends BaseEntity {
  onDelete: any;
  personName: string;
  installmentNumber: number;
  description: string;
  dueDate: Date;
  amount: number;
  paymentDate: Date;

  /**
   * Static method to filter AccountsReceivable records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<AccountsReceivable[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new AccountsReceivable
   *
   * @param data Object with AccountsReceivable properties
   * @returns Promise<AccountsReceivable>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a AccountsReceivable
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<AccountsReceivable>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a AccountsReceivable
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a AccountsReceivable by ID
   *
   * @param id The entity ID
   * @returns Promise<AccountsReceivable | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
