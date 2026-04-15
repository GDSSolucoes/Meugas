import { BaseEntity } from './BaseEntity';


export enum ProductCategoriesEnum {
  EQUIPAMENTO = "equipamento",
  ACESSORIO = "acessorio",
  GLP = "glp",
  AGUA = "agua",
  VASILHAME = "vasilhame",
  OUTROS = "outros",
}

export enum IcmsOrigemEnum {
  ORIGEM_0 = "0",
  ORIGEM_1 = "1",
  ORIGEM_2 = "2",
  ORIGEM_3 = "3",
  ORIGEM_4 = "4",
  ORIGEM_5 = "5",
  ORIGEM_6 = "6",
  ORIGEM_7 = "7",
  ORIGEM_8 = "8",
}

/**
 * Product Entity
 *
 * Represents a Product record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Products extends BaseEntity {
  // No properties defined yet

  /**
   * Static method to filter Product records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Product[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new Product
   *
   * @param data Object with Product properties
   * @returns Promise<Product>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a Product
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Product>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a Product
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a Product by ID
   *
   * @param id The entity ID
   * @returns Promise<Product | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
