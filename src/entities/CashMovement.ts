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
  cashAccountName: string;
  type: CashMovementTypeEnum;
  amount: number;
  description: string;
  movementDate: Date;
  personName: string;
  groupId: string;
  groupName: string;
  relatedDocId: string;
  onDelete: any;

  /**
   * Static method to filter CashMovement records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<CashMovement[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new CashMovement
   *
   * @param data Object with CashMovement properties
   * @returns Promise<CashMovement>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a CashMovement
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<CashMovement>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a CashMovement
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a CashMovement by ID
   *
   * @param id The entity ID
   * @returns Promise<CashMovement | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
