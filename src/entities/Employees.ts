import { BaseEntity } from './BaseEntity';


export enum EmployeePositionEnum {
  VENDEDOR = "vendedor",
  ENTREGADOR = "entregador",
  GERENTE = "gerente",
  ADMINISTRATIVO = "administrativo",
  OUTRO = "outro",
}

/**
 * Employee Entity
 *
 * Represents a Employee record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Employees extends BaseEntity {
  name: string;
  document: string;
  email: string;
  phone: string;
  position: EmployeePositionEnum;
  salary: number;
  hireDate: Date;
  vacationStart: Date;
  vacationEnd: Date;
  onDelete: any;
  active: boolean;

  /**
   * Static method to filter Employee records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Employee[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new Employee
   *
   * @param data Object with Employee properties
   * @returns Promise<Employee>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a Employee
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Employee>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a Employee
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a Employee by ID
   *
   * @param id The entity ID
   * @returns Promise<Employee | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
