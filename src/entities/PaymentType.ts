import { BaseEntity } from './BaseEntity';


export enum PaymentTypesTypeEnum {
  DINHEIRO = "dinheiro",
  PIX = "pix",
  CARTAO_DEBITO = "cartaoDebito",
  CARTAO_CREDITO = "cartaoCredito",
  BOLETO = "boleto",
  CHEQUE = "cheque",
  CONVENIO = "convenio",
}

/**
 * PaymentType Entity
 *
 * Represents a PaymentType record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class PaymentType extends BaseEntity {
  name: string;
  type: PaymentTypesTypeEnum;
  maxInstallments: number;
  daysInterval: number;
  onDelete: any;
  active: boolean;

  /**
   * Static method to filter PaymentType records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<PaymentType[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new PaymentType
   *
   * @param data Object with PaymentType properties
   * @returns Promise<PaymentType>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a PaymentType
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<PaymentType>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a PaymentType
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a PaymentType by ID
   *
   * @param id The entity ID
   * @returns Promise<PaymentType | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
