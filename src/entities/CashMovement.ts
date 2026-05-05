import { BaseEntity } from './BaseEntity';


export enum CashMovementTypeEnum {
  RECEITA = "receita",
  DESPESA = "despesa",
}

/**
 * CashMovement Entity
 *
 * Represents a CashMovement record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class CashMovement extends BaseEntity {
  cashAccountId: string;
  cashAccountName: string;
  type: CashMovementTypeEnum;
  description: string;
  amount: number;
  movementDate: Date;
  personId: string;
  personName: string;
  groupId: string;
  groupName: string;
  subgroupId: string;
  subgroupName: string;
  documentNumber: string;
  competenceMonth: string;
  relatedDocId: string;
  paymentTypeId: string;
  paymentTypeName: string;
  notes: string;
  isAccounting: boolean;
  sectorId: string;
  sectorName: string;

  static baseUrl: string = "/cashMovements";

  /**
   * Static method to filter CashMovement records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<CashMovement[]>
   */
  static async filter(filters: Partial<CashMovement> = {}, pagination = {}) : Promise<CashMovement[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<CashMovement[]>;
  }

  /**
   * Static method to create a new CashMovement
   *
   * @param data Object with CashMovement properties
   * @returns Promise<CashMovement>
   */
  static async create(data: Partial<CashMovement>): Promise<CashMovement> {
    return super._create.call(this, this.baseUrl, data) as Promise<CashMovement>;
  }

  /**
   * Static method to update a CashMovement
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<CashMovement>
   */
  static async update(id: string, data: Partial<CashMovement>): Promise<CashMovement> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<CashMovement>;
  }

  /**
   * Static method to delete a CashMovement
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a CashMovement by ID
   *
   * @param id The entity ID
   * @returns Promise<CashMovement | null>
   */
  static async findById(id: string): Promise<CashMovement | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<CashMovement | null>;
  }
}
