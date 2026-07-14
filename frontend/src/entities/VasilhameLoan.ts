import { BaseEntity } from "./BaseEntity";

export enum VasilhameLoanStatusEnum {
  PENDENTE = "pendente",
  DEVOLVIDO_PARCIAL = "devolvido_parcial",
  DEVOLVIDO_TOTAL = "devolvido_total",
}

/**
 * VasilhameLoan Entity
 *
 * Represents a VasilhameLoan record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class VasilhameLoan extends BaseEntity {
  saleId: string;
  personId: string;
  personName: string;
  vasilhameId: string;
  vasilhameName: string;
  sectorId?: string;
  sectorName?: string;
  loanQuantity: number;
  returnedQuantity: number;
  loanDate: Date;
  returnDate?: Date;
  status: VasilhameLoanStatusEnum;
  static baseUrl: string = "/vasilhameLoans";

  /**
   * Static method to filter VasilhameLoan records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<VasilhameLoan[]>
   */
  static async filter(
    filters: Partial<VasilhameLoan> = {},
    pagination = {},
  ): Promise<VasilhameLoan[]> {
    return super._filter.call(
      this,
      this.baseUrl,
      filters,
      pagination,
    ) as Promise<VasilhameLoan[]>;
  }

  /**
   * Static method to create a new VasilhameLoan
   *
   * @param data Object with VasilhameLoan properties
   * @returns Promise<VasilhameLoan>
   */
  static async create(data: Partial<VasilhameLoan>): Promise<VasilhameLoan> {
    return super._create.call(
      this,
      this.baseUrl,
      data,
    ) as Promise<VasilhameLoan>;
  }

  /**
   * Static method to update a VasilhameLoan
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<VasilhameLoan>
   */
  static async update(
    id: string,
    data: Partial<VasilhameLoan>,
  ): Promise<VasilhameLoan> {
    return super._update.call(
      this,
      this.baseUrl,
      id,
      data,
    ) as Promise<VasilhameLoan>;
  }

  /**
   * Static method to delete a VasilhameLoan
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a VasilhameLoan by ID
   *
   * @param id The entity ID
   * @returns Promise<VasilhameLoan | null>
   */
  static async findById(id: string): Promise<VasilhameLoan | null> {
    return super._findById.call(
      this,
      this.baseUrl,
      id,
    ) as Promise<VasilhameLoan | null>;
  }
}
