import { BaseEntity } from './BaseEntity';


export enum ProductPickupStatusEnum {
  PENDENTE = "pendente",
  RETIRADO_PARCIAL = "retiradoParcial",
  RETIRADO_TOTAL = "retiradoTotal",
}

/**
 * ProductPickup Entity
 *
 * Represents a ProductPickup record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class ProductPickup extends BaseEntity {
  saleId: string;
  onDelete: any;
  personName: string;
  productName: string;
  pickupQuantity: number;
  collectedQuantity: number;
  collectedDate: Date;
  saleDate: Date;
  sectorId: string;
  sectorName: string;
  notaFiscal: string;
  pedido: string;
  status: ProductPickupStatusEnum;

  /**
   * Static method to filter ProductPickup records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<ProductPickup[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new ProductPickup
   *
   * @param data Object with ProductPickup properties
   * @returns Promise<ProductPickup>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a ProductPickup
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<ProductPickup>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a ProductPickup
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a ProductPickup by ID
   *
   * @param id The entity ID
   * @returns Promise<ProductPickup | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
