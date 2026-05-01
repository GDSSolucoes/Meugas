import { BaseEntity } from './BaseEntity';


export enum VehicleTypeEnum {
  CARRO = "carro",
  MOTO = "moto",
  CAMINHAO = "caminhao",
  VAN = "van",
  UTILITARIO = "utilitario",
  OUTRO = "outro",
}

/**
 * Vehicle Entity
 *
 * Represents a Vehicle record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Vehicle extends BaseEntity {
  plate: string;
  fleetNumber?: string;
  type: VehicleTypeEnum;
  description: string;
  year?: number;
  color?: string;
  initialKm?: number;
  static baseUrl: string = "/vehicles";

  /**
   * Static method to filter Vehicle records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Vehicle[]>
   */
  static async filter(filters = {}, pagination = {}) : Promise<Vehicle[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<Vehicle[]>;
  }

  /**
   * Static method to create a new Vehicle
   *
   * @param data Object with Vehicle properties
   * @returns Promise<Vehicle>
   */
  static async create(data): Promise<Vehicle> {
    return super._create.call(this, this.baseUrl, data) as Promise<Vehicle>;
  }

  /**
   * Static method to update a Vehicle
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Vehicle>
   */
  static async update(id, data): Promise<Vehicle> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<Vehicle>;
  }

  /**
   * Static method to delete a Vehicle
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a Vehicle by ID
   *
   * @param id The entity ID
   * @returns Promise<Vehicle | null>
   */
  static async findById(id): Promise<Vehicle | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<Vehicle | null>;
  }
}
