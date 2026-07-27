import { api } from "@/api/apiClient";
import { BaseEntity } from "./BaseEntity";

export enum ProductPickupStatusEnum {
  PENDENTE = "pendente",
  RETIRADO_PARCIAL = "retirado_parcial",
  RETIRADO_TOTAL = "retirado_total",
}

/**
 * ProductPickup Entity
 *
 * Represents a ProductPickup record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class ProductPickup extends BaseEntity {
  saleId: string;
  personId: string;
  personName: string;
  productId: string;
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
  static baseUrl: string = "/productPickups";

  /**
   * Static method to filter ProductPickup records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<ProductPickup[]>
   */
  static async filter(
    filters: Partial<ProductPickup> = {},
    pagination = {},
  ): Promise<ProductPickup[]> {
    return super._filter.call(
      this,
      this.baseUrl,
      filters,
      pagination,
    ) as Promise<ProductPickup[]>;
  }

  /**
   * Static method to create a new ProductPickup
   *
   * @param data Object with ProductPickup properties
   * @returns Promise<ProductPickup>
   */
  static async create(data: Partial<ProductPickup>): Promise<ProductPickup> {
    return super._create.call(
      this,
      this.baseUrl,
      data,
    ) as Promise<ProductPickup>;
  }

  /**
   * Static method to update a ProductPickup
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<ProductPickup>
   */
  static async update(
    id: string,
    data: Partial<ProductPickup>,
  ): Promise<ProductPickup> {
    return super._update.call(
      this,
      this.baseUrl,
      id,
      data,
    ) as Promise<ProductPickup>;
  }

  /**
   * Static method to delete a ProductPickup
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a ProductPickup by ID
   *
   * @param id The entity ID
   * @returns Promise<ProductPickup | null>
   */
  static async findById(id: string): Promise<ProductPickup | null> {
    return super._findById.call(
      this,
      this.baseUrl,
      id,
    ) as Promise<ProductPickup | null>;
  }

  /**
   * Static method to dar baixa in a ProductPickup
   *
   * @param id The entity ID
   * @param data Object with dar baixa data
   * @returns Promise<ProductPickup>
   */
  static async darBaixa(
    id: string,
    data: {
      quantityToCollect: number;
      sectorId: string;
      sectorName?: string;
      collectedDate: string;
      notaFiscal?: string;
      pedido?: string;
    },
  ): Promise<ProductPickup> {
    try {
      const endpoint = `${this.baseUrl}/${id}/darBaixa`;
      const response = await api.post(endpoint, data);
      return new this(response.data);
    } catch (error) {
      console.error(`Erro ao dar baixa ${this.name}:`, error);
      throw error;
    }
  }
}
