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
  static baseUrl: string = "/cashAccounts";

  /**
   * Static method to filter CashAccount records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<CashAccount[]>
   */
  static async filter(filters: Partial<CashAccount> = {}, pagination = {}) : Promise<CashAccount[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<CashAccount[]>;
  }

  /**
   * Static method to create a new CashAccount
   *
   * @param data Object with CashAccount properties
   * @returns Promise<CashAccount>
   */
  static async create(data: Partial<CashAccount>): Promise<CashAccount> {
    return super._create.call(this, this.baseUrl, data) as Promise<CashAccount>;
  }

  /**
   * Static method to update a CashAccount
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<CashAccount>
   */
  static async update(id: string, data: Partial<CashAccount>): Promise<CashAccount> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<CashAccount>;
  }

  /**
   * Static method to delete a CashAccount
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a CashAccount by ID
   *
   * @param id The entity ID
   * @returns Promise<CashAccount | null>
   */
  static async findById(id: string): Promise<CashAccount | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<CashAccount | null>;
  }
}
