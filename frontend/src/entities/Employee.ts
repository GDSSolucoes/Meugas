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
export class Employee extends BaseEntity {
  name: string;
  document: string;
  email: string;
  phone: string;
  position: EmployeePositionEnum;
  salary: number;
  hireDate: Date;
  vacationStart: Date;
  vacationEnd: Date;
  static baseUrl: string = "/employees";

  /**
   * Static method to filter Employee records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Employee[]>
   */
  static async filter(filters: Partial<Employee> = {}, pagination = {}) : Promise<Employee[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<Employee[]>;
  }

  /**
   * Static method to create a new Employee
   *
   * @param data Object with Employee properties
   * @returns Promise<Employee>
   */
  static async create(data: Partial<Employee>): Promise<Employee> {
    return super._create.call(this, this.baseUrl, data) as Promise<Employee>;
  }

  /**
   * Static method to update a Employee
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Employee>
   */
  static async update(id: string, data: Partial<Employee>): Promise<Employee> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<Employee>;
  }

  /**
   * Static method to delete a Employee
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a Employee by ID
   *
   * @param id The entity ID
   * @returns Promise<Employee | null>
   */
  static async findById(id: string): Promise<Employee | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<Employee | null>;
  }
}
