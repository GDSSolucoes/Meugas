import { BaseEntity } from './BaseEntity';


/**
 * Fueling Entity
 *
 * Represents a Fueling record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Fuelings extends BaseEntity {
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
  onDelete: any;

  /**
   * Static method to filter Fueling records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Fueling[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new Fueling
   *
   * @param data Object with Fueling properties
   * @returns Promise<Fueling>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a Fueling
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Fueling>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a Fueling
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a Fueling by ID
   *
   * @param id The entity ID
   * @returns Promise<Fueling | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
