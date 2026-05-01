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

  static baseUrl: string = "/paymentTypes";

  /**
   * Static method to filter PaymentType records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<PaymentType[]>
   */
  static async filter(filters: Partial<PaymentType> = {}, pagination = {}) : Promise<PaymentType[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<PaymentType[]>;
  }

  /**
   * Static method to create a new PaymentType
   *
   * @param data Object with PaymentType properties
   * @returns Promise<PaymentType>
   */
  static async create(data: Partial<PaymentType>): Promise<PaymentType> {
    return super._create.call(this, this.baseUrl, data) as Promise<PaymentType>;
  }

  /**
   * Static method to update a PaymentType
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<PaymentType>
   */
  static async update(id: string, data: Partial<PaymentType>): Promise<PaymentType> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<PaymentType>;
  }

  /**
   * Static method to delete a PaymentType
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a PaymentType by ID
   *
   * @param id The entity ID
   * @returns Promise<PaymentType | null>
   */
  static async findById(id: string): Promise<PaymentType | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<PaymentType | null>;
  }
}
