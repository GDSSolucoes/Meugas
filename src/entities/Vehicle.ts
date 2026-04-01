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

  /**
   * Static method to filter Vehicle records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Vehicle[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new Vehicle
   *
   * @param data Object with Vehicle properties
   * @returns Promise<Vehicle>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a Vehicle
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Vehicle>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a Vehicle
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a Vehicle by ID
   *
   * @param id The entity ID
   * @returns Promise<Vehicle | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
