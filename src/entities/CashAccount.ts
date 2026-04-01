import { BaseEntity } from './BaseEntity';


export enum CashAccountTypeEnum {
  CAIXA_FISICO = 'caixa_fisico',
  CONTA_BANCARIA = 'conta_bancaria',
}

/**
 * CashAccount Entity
 *
 * Represents a CashAccount record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class CashAccount extends BaseEntity {
  name: string;
  type: CashAccountTypeEnum;
  balance: number;
  initialBalance: number;
  initialBalanceDate: Date;
  onDelete: any;
  active: boolean;

  /**
   * Static method to filter CashAccount records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<CashAccount[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new CashAccount
   *
   * @param data Object with CashAccount properties
   * @returns Promise<CashAccount>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a CashAccount
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<CashAccount>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a CashAccount
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a CashAccount by ID
   *
   * @param id The entity ID
   * @returns Promise<CashAccount | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
