import { BaseEntity } from './BaseEntity';


export enum FacilitadorModeloFiscalEnum {
  NFCE = "55",
  NFCeST = "65",
}


export enum FacilitadorRegimeTributarioEnum {
  SIMPLES_NACIONAL = "simples_nacional",
  LUCRO_PRESUMIDO = "lucro_presumido",
  LUCRO_REAL = "lucro_real",
  MEI = "mei",
}

export enum FacilitadorTipoOperacaoEnum {
  VENDA = "venda",
  COMPRA = "compra",
  REMESSA = "remessa",
  RETORNO = "retorno",
  DEVOLUCAO = "devolucao",
  TRANSFERENCIA = "transferencia",
  OUTRAS = "outras",
}
/**
 * Facilitadore Entity
 *
 * Represents a Facilitadore record in the system.
 * Automatically generated entity class with CRUD operations.
 */
export class Facilitador extends BaseEntity {
  empresaId: string;
  nome: string;
  modeloFiscal: FacilitadorModeloFiscalEnum;
  tipoOperacao: FacilitadorTipoOperacaoEnum;
  cfop: string;
  regimeTributario: FacilitadorRegimeTributarioEnum;
  icmsSituacaoTributaria: string;
  pisSituacaoTributaria: string;
  cofinsSituacaoTributaria: string;
  ipiSituacaoTributaria: string;
  observacoes: string;
  static baseUrl: string = "/facilitadores";

  /**
   * Static method to filter Facilitadore records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Facilitadore[]>
   */
  static async filter(filters: Partial<Facilitador> = {}, pagination = {}) : Promise<Facilitador[]> {
    return super._filter.call(this, this.baseUrl, filters, pagination) as Promise<Facilitador[]>;
  }

  /**
   * Static method to create a new Facilitadore
   *
   * @param data Object with Facilitadore properties
   * @returns Promise<Facilitadore>
   */
  static async create(data: Partial<Facilitador>): Promise<Facilitador> {
    return super._create.call(this, this.baseUrl, data) as Promise<Facilitador>;
  }

  /**
   * Static method to update a Facilitadore
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Facilitadore>
   */
  static async update(id: string, data: Partial<Facilitador>): Promise<Facilitador> {
    return super._update.call(this, this.baseUrl, id, data) as Promise<Facilitador>;
  }

  /**
   * Static method to delete a Facilitadore
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    return super._delete.call(this, this.baseUrl, id) as Promise<void>;
  }

  /**
   * Static method to find a Facilitadore by ID
   *
   * @param id The entity ID
   * @returns Promise<Facilitadore | null>
   */
  static async findById(id: string): Promise<Facilitador | null> {
    return super._findById.call(this, this.baseUrl, id) as Promise<Facilitador | null>;
  }
}
