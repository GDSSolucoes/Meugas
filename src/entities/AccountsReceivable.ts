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
  personId: string;
  personName: string;
  installmentNumber: number;
  description: string;
  dueDate: Date;
  amount: number;
  paymentDate: Date;
  saleId: string;
  status: AccountsReceivableStatusEnum;
  sectorId: string;
  sectorName: string;
  renegociacaoOrigem: string;
  renegociacaoData: Date;
  renegociacaoObservacao: string;
  paymentTypeId: string;
  paymentTypeName: string;

  static baseUrl: string = "/accountsReceivables";


  constructor(data?: Partial<AccountsReceivable>) {
    super(data);
  }


  /**
   * Static method to filter AccountsReceivable records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<AccountsReceivable[]>
   */
  static async filter(filters = {}, pagination = {}) : Promise<AccountsReceivable[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<AccountsReceivable[]>;
  }

  /**
   * Static method to create a new AccountsReceivable
   *
   * @param data Object with AccountsReceivable properties
   * @returns Promise<AccountsReceivable>
   */
  static async create(data): Promise<AccountsReceivable> {
    return super._create.call(this, this.baseUrl, data) as Promise<AccountsReceivable>;
  }

  /**
   * Static method to update a AccountsReceivable
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<AccountsReceivable>
   */
  static async update(id, data): Promise<AccountsReceivable> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<AccountsReceivable>;
  }

  /**
   * Static method to delete a AccountsReceivable
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a AccountsReceivable by ID
   *
   * @param id The entity ID
   * @returns Promise<AccountsReceivable | null>
   */
  static async findById(id): Promise<AccountsReceivable | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<AccountsReceivable | null>;
  }
}
