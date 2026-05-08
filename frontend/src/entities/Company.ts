import { BaseEntity } from './BaseEntity';

export type CompanyAddress = {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  codigoMunicipio?: string;
};

export type CompanyParametrosFiscais = {
  cnpj?: string;
  razaoSocial?: string;
  inscricaoEstadual?: string;
  regimeTributario?:
    | "simplesNacional"
    | "lucroPresumido"
    | "lucroReal"
    | "mei";
  ambienteNfe?: "homologacao" | "producao";
  emitirNfe?: boolean;
  emitirNfce?: boolean;
  serieNfe?: number;
  serieNfce?: number;
  numeroInicialNfe?: number;
  numeroInicialNfce?: number;
  observacoesNfe?: string;
  observacoesNfce?: string;
};

export enum CompanyStatusEnum {
  ATIVA = "ativa",
  INATIVA = "inativa",
  SUSPENSA_PAGAMENTO = "suspensa_pagamento",
}

export enum PlanTypeEnum {
  BASIC = "basic",
  PREMIUM = "premium",
  ENTERPRISE = "enterprise",
}


/**
 * Companies Entity
 *
 * Represents a Companies record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Company extends BaseEntity {
  name: string;
  document: string;
  email: string;
  phone?: string;
  address?: CompanyAddress;
  parametrosFiscais?: CompanyParametrosFiscais;
  planType?: PlanTypeEnum;
  status?: CompanyStatusEnum;
  adminName: string;
  adminEmail: string;
  monthlyFee?: number;
  suspensionReason?: string;
  notes: string;
  dueDate?: Date;
  static baseUrl: string = '/companies';

  /**
   * Static method to filter Companies records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Companies[]>
   */
  static async filter(filters: Partial<Company> = {}, pagination = {}): Promise<Company[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<Company[]>;
  }

  /**
   * Static method to create a new Companies
   *
   * @param data Object with Companies properties
   * @returns Promise<Companies>
   */
  static async create(data: Partial<Company>): Promise<Company> {
    return super._create.call(this, this.baseUrl, data) as Promise<Company>;
  }

  /**
   * Static method to update a Companies
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Companies>
   */
  static async update(id: string, data: Partial<Company>): Promise<Company> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<Company>;
  }

  /**
   * Static method to delete a Companies
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a Companies by ID
   *
   * @param id The entity ID
   * @returns Promise<Companies | null>
   */
  static async findById(id: string): Promise<Company | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<Company | null>;
  }
}
