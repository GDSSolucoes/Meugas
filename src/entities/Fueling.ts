import { BaseEntity } from './BaseEntity';


/**
 * Fueling Entity
 *
 * Represents a Fueling record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Fueling extends BaseEntity {
  vehicleId: string;
  vehiclePlate: string;
  vehicleDescription: string;
  fleetNumber: string;
  driverId: string;
  driverName: string;
  fuelingDate: Date;
  currentKm: number;
  liters: number;
  totalValue: number;
  pricePerLiter: number;
  kmTraveled: number;
  consumption: number;
  costPerKm: number;
  createExpense: boolean;
  cashMovementId: string;
  
  static baseUrl: string = "/fuelings";

  /**
   * Static method to filter Fueling records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Fueling[]>
   */
  static async filter(filters: Partial<Fueling> = {}, pagination = {}) : Promise<Fueling[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<Fueling[]>;
  }

  /**
   * Static method to create a new Fueling
   *
   * @param data Object with Fueling properties
   * @returns Promise<Fueling>
   */
  static async create(data: Partial<Fueling>): Promise<Fueling> {
    return super._create.call(this, this.baseUrl, data) as Promise<Fueling>;
  }

  /**
   * Static method to update a Fueling
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Fueling>
   */
  static async update(id: string, data: Partial<Fueling>): Promise<Fueling> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<Fueling>;
  }

  /**
   * Static method to delete a Fueling
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a Fueling by ID
   *
   * @param id The entity ID
   * @returns Promise<Fueling | null>
   */
  static async findById(id: string): Promise<Fueling | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<Fueling | null>;
  }
}
