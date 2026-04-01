import { BaseEntity } from './BaseEntity';

export enum PersonType {
  CLIENTE = 'cliente',
  FORNECEDOR = 'fornecedor',
  PONTO_VENDA = 'ponto_venda',
  CONVENIADA = 'conveniada'
}

export interface PersonAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  reference_point?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}

export class Person extends BaseEntity {
  companyId!: string;
  personNumber?: string;
  name!: string;
  document?: string;
  email?: string;
  phone?: string[];
  type!: PersonType;
  address?: PersonAddress;
  glpConsumptionDays?: number;
  birthday?: Date;
  conveniadaId?: string;
  conveniadaName?: string;
  companyName?: string;
  createdByName?: string;
  active!: boolean;
  deleted?: boolean;

  constructor(data?: Partial<Person>) {
    super(data);
    if (data) {
      // Convert date strings to Date objects
      if (data.birthday && typeof data.birthday === 'string') {
        this.birthday = new Date(data.birthday);
      }
      if (data.createdAt && typeof data.createdAt === 'string') {
        this.createdAt = new Date(data.createdAt);
      }
      if (data.updatedAt && typeof data.updatedAt === 'string') {
        this.updatedAt = new Date(data.updatedAt);
      }
    }
  }

  /**
   * Get full name with person number
   */
  get fullName(): string {
    if (this.personNumber) {
      return `${this.personNumber} - ${this.name}`;
    }
    return this.name;
  }

  /**
   * Check if person is active
   */
  get isActive(): boolean {
    return this.active && !this.deleted;
  }

  /**
   * Get formatted document (CPF/CNPJ)
   */
  get formattedDocument(): string {
    if (!this.document) return '';

    // Simple CPF/CNPJ formatting (you can enhance this)
    const clean = this.document.replace(/\D/g, '');
    if (clean.length === 11) {
      // CPF: 000.000.000-00
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (clean.length === 14) {
      // CNPJ: 00.000.000/0000-00
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return this.document;
  }
}