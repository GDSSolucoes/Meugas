import { BaseEntity } from './BaseEntity';


export enum VasilhameLoanStatusEnum {
  PENDENTE = "pendente",
  DEVOLVIDO_PARCIAL = "devolvidoParcial",
  DEVOLVIDO_TOTAL = "devolvidoTotal",
}

/**
 * VasilhameLoan Entity
 *
 * Represents a VasilhameLoan record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class VasilhameLoans extends BaseEntity {
  onDelete: any;
  personName: string;
  vasilhameId: string;
  vasilhameName: string;
  loanQuantity: number;
  returnedQuantity: number;
  loanDate: Date;
  status: VasilhameLoanStatusEnum;

  /**
   * Static method to filter VasilhameLoan records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<VasilhameLoan[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new VasilhameLoan
   *
   * @param data Object with VasilhameLoan properties
   * @returns Promise<VasilhameLoan>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a VasilhameLoan
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<VasilhameLoan>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a VasilhameLoan
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a VasilhameLoan by ID
   *
   * @param id The entity ID
   * @returns Promise<VasilhameLoan | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
