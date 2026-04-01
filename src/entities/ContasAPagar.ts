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
  // No properties defined yet

  /**
   * Static method to filter ContasAPagar records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<ContasAPagar[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new ContasAPagar
   *
   * @param data Object with ContasAPagar properties
   * @returns Promise<ContasAPagar>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a ContasAPagar
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<ContasAPagar>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a ContasAPagar
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a ContasAPagar by ID
   *
   * @param id The entity ID
   * @returns Promise<ContasAPagar | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
