import { BaseEntity } from './BaseEntity';


export enum ContasAPagarStatusEnum {
  ABERTO = "aberto",
  PAGO = "pago",
  VENCIDO = "vencido",
}

/**
 * ContasAPagar Entity
 *
 * Represents a ContasAPagar record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class ContasAPagar extends BaseEntity {
  supplierId: string;
  supplierName: string;
  description: string;
  dueDate: Date;
  amount: number;
  installmentNumber: number;
  status: ContasAPagarStatusEnum;
  paymentTypeId: string;
  paymentTypeName: string;
  paymentDate: Date;
  purchaseId: string;
  nfeNumber: string;
  groupId: string;
  groupName: string;
  subgroupId: string;
  subgroupName: string;
  documentNumber: string;
  reagendamentoMotivo: string;
  reagendamentoData: string;
  static baseUrl: string = '/contasAPagar';

  /**
   * Static method to filter ContasAPagar records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<ContasAPagar[]>
   */
  static async filter(filters: Partial<ContasAPagar> = {}, pagination = {}) : Promise<ContasAPagar[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<ContasAPagar[]>;
  }

  /**
   * Static method to create a new ContasAPagar
   *
   * @param data Object with ContasAPagar properties
   * @returns Promise<ContasAPagar>
   */
  static async create(data: Partial<ContasAPagar>): Promise<ContasAPagar> {
    return super._create.call(this, this.baseUrl, data) as Promise<ContasAPagar>;
  }

  /**
   * Static method to update a ContasAPagar
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<ContasAPagar>
   */
  static async update(id: string, data: Partial<ContasAPagar>): Promise<ContasAPagar> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<ContasAPagar>;
  }

  /**
   * Static method to delete a ContasAPagar
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a ContasAPagar by ID
   *
   * @param id The entity ID
   * @returns Promise<ContasAPagar | null>
   */
  static async findById(id: string): Promise<ContasAPagar | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<ContasAPagar | null>;
  }
}
