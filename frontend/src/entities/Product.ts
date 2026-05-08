import { BaseEntity } from "./BaseEntity";

export enum ProductCategoriesEnum {
  EQUIPAMENTO = "equipamento",
  ACESSORIO = "acessorio",
  GLP = "glp",
  AGUA = "agua",
  VASILHAME = "vasilhame",
  OUTROS = "outros",
}
/**
 * Products Entity
 *
 * Represents a Products record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Product extends BaseEntity {
  name: string;
  code?: string;
  category?: ProductCategoriesEnum;
  unitPrice?: number;
  costPrice?: number;
  minStock?: number;
  vasilhameId?: string;
  vasilhameName?: string;
  ncm?: string;
  cest?: string;
  unidadeTributavel?: string;
  icmsOrigem: number;
  benegicioFiscal?: string;
  anpCodigo?: string;
  anpDescricao?: string;
  valorSemIcmsKg?: number;
  kgPorUnidadeGlp?: number;
  percentualGnNacional: number;
  percentualGnImportado: number;
  codif: string;
  pesoLiquido?: number;
  pesoBruto?: number;
  informacoesAdicionaisNfe?: string;

  static baseUrl: string = "/products";

  /**
   * Static method to filter Products records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Products[]>
   */
  static async filter(filters: Partial<Product> = {}, pagination = {}): Promise<Product[]> {
    return super._filter.call(
      this,
      this.baseUrl,
      filters,
      pagination,
    ) as Promise<Product[]>;
  }

  /**
   * Static method to create a new Products
   *
   * @param data Object with Products properties
   * @returns Promise<Products>
   */
  static async create(data: Partial<Product>): Promise<Product> {
    return super._create.call(this, this.baseUrl, data) as Promise<Product>;
  }

  /**
   * Static method to update a Products
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Products>
   */
  static async update(id: string, data: Partial<Product>): Promise<Product> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<Product>;
  }

  /**
   * Static method to delete a Products
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a Products by ID
   *
   * @param id The entity ID
   * @returns Promise<Products | null>
   */
  static async findById(id: string): Promise<Product | null> {
    return super._findById.call(
      this,
      this.baseUrl,
      id,
    ) as Promise<Product | null>;
  }
}
