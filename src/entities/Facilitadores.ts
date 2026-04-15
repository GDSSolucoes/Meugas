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
export class Facilitadores extends BaseEntity {
  empresaId: string;
  nome: string;
  tipoOperacao: FacilitadorTipoOperacaoEnum;
  cfop: string;
  regimeTributario: FacilitadorRegimeTributarioEnum;
  icmsSituacaoTributaria: string;
  pisSituacaoTributaria: string;
  cofinsSituacaoTributaria: string;
  ipiSituacaoTributaria: string;
  observacoes: string;
  ativo: boolean;
  onDelete: any;

  /**
   * Static method to filter Facilitadore records
   *
   * @param filters Object with filter criteria
   * @param pagination Pagination options (page, pageSize, sortBy, sortOrder)
   * @returns Promise<Facilitadore[]>
   */
  static async filter(filters = {}, pagination = {}) {
    return super.filter.call(this, filters, pagination);
  }

  /**
   * Static method to create a new Facilitadore
   *
   * @param data Object with Facilitadore properties
   * @returns Promise<Facilitadore>
   */
  static async create(data) {
    return super.create.call(this, data);
  }

  /**
   * Static method to update a Facilitadore
   *
   * @param id The entity ID
   * @param data Object with updated properties
   * @returns Promise<Facilitadore>
   */
  static async update(id, data) {
    return super.update.call(this, id, data);
  }

  /**
   * Static method to delete a Facilitadore
   *
   * @param id The entity ID
   * @returns Promise<void>
   */
  static async delete(id) {
    return super.delete.call(this, id);
  }

  /**
   * Static method to find a Facilitadore by ID
   *
   * @param id The entity ID
   * @returns Promise<Facilitadore | null>
   */
  static async findById(id) {
    return super.findById.call(this, id);
  }
}
