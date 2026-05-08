import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Inject } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import {
  companies,
  facilitadores,
  persons,
  products,
  sales,
} from "../../database/schemas";
import { EmitFiscalDto } from "./dto/emit-fiscal.dto";
import { CancelFiscalNoteDto } from "./dto/cancel-fiscal-note.dto";
import { DownloadFiscalDto } from "./dto/download-fiscal.dto";
import { SearchAddressDto } from "./dto/search-address.dto";

type UserContext = {
  id: string;
  role: string;
  companyId: string;
};

@Injectable()
export class FiscalService {
  constructor(
    @Inject("DB") private readonly db: NodePgDatabase,
    private readonly config: ConfigService,
  ) {}

  async emitNFe(dto: EmitFiscalDto, user: UserContext) {
    return this.emitFiscal(dto, user, "nfe");
  }

  async emitNFCe(dto: EmitFiscalDto, user: UserContext) {
    return this.emitFiscal(dto, user, "nfce");
  }

  async cancelFiscalNote(dto: CancelFiscalNoteDto, user: UserContext) {
    const sale = await this.getSale(dto.saleId);
    if (!sale) {
      throw new NotFoundException("Venda não encontrada");
    }
    if (sale.companyId !== user.companyId) {
      throw new NotFoundException(
        "Venda não encontrada para a empresa do usuário",
      );
    }

    const notaType = dto.tipoNota === "nfe" ? "nfe" : "nfce";
    const noteKey = dto.tipoNota === "nfe" ? sale.nfeKey : sale.nfceKey;
    if (!noteKey) {
      throw new BadRequestException(
        `Chave da ${notaType.toUpperCase()} não encontrada para esta venda`,
      );
    }

    const company = await this.getCompany(user.companyId);
    if (!company) {
      throw new NotFoundException("Empresa não encontrada");
    }

    const ambiente = this.getAmbiente(company.parametrosFiscais, notaType);
    if (!ambiente) {
      throw new BadRequestException(
        `Ambiente fiscal para ${notaType.toUpperCase()} não configurado`,
      );
    }

    const token = await this.getNuvemFiscalToken();
    const baseUrl =
      ambiente === "producao"
        ? "https://api.nuvemfiscal.com.br"
        : "https://api.sandbox.nuvemfiscal.com.br";
    const endpoint = `${baseUrl}/${notaType}/${noteKey}/cancelamento`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ justificativa: dto.justificativa }),
    });

    const responseText = await response.text();
    let responseData: any;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (_error) {
      throw new InternalServerErrorException(
        "Erro ao interpretar resposta da Nuvem Fiscal: " + responseText,
      );
    }

    if (!response.ok) {
      throw new InternalServerErrorException(
        responseData?.error ||
          responseData ||
          "Erro ao cancelar nota fiscal na Nuvem Fiscal",
      );
    }

    const updateData: any = {};
    if (notaType === "nfe") {
      updateData.nfeCancelada = true;
      updateData.nfeDataCancelamento = new Date();
      updateData.nfeJustificativaCancelamento = dto.justificativa;
    } else {
      updateData.nfceCancelada = true;
      updateData.nfceDataCancelamento = new Date();
      updateData.nfceJustificativaCancelamento = dto.justificativa;
    }

    await this.db.update(sales).set(updateData).where(eq(sales.id, dto.saleId));

    return {
      success: true,
      message: `Nota ${notaType.toUpperCase()} cancelada com sucesso`,
      protocolo: responseData?.protocolo || null,
    };
  }

  async downloadDanfe(dto: DownloadFiscalDto, user: UserContext) {
    const sale = await this.getSale(dto.saleId);
    if (!sale || sale.companyId !== user.companyId) {
      throw new NotFoundException("Venda não encontrada");
    }

    const key = dto.type === "nfe" ? sale.nfeKey : sale.nfceKey;
    if (!key) {
      throw new BadRequestException(
        `Chave da ${dto.type.toUpperCase()} não encontrada`,
      );
    }

    const company = await this.getCompany(user.companyId);
    if (!company) {
      throw new NotFoundException("Empresa não encontrada");
    }

    const ambiente = this.getAmbiente(company.parametrosFiscais, dto.type);
    if (!ambiente) {
      throw new BadRequestException(
        `Ambiente fiscal para ${dto.type.toUpperCase()} não configurado`,
      );
    }

    const baseUrl =
      ambiente === "producao"
        ? "https://api.nuvemfiscal.com.br"
        : "https://api.sandbox.nuvemfiscal.com.br";
    const endpoint = `${baseUrl}/${dto.type}/${key}`;

    const token = await this.getNuvemFiscalToken();
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new InternalServerErrorException(
        result?.error || "Erro ao baixar DANFE da Nuvem Fiscal",
      );
    }

    return {
      success: true,
      pdfBase64: result.pdf || result.pdfBase64 || result.data || null,
      filename: `${dto.type.toUpperCase()}_${sale.saleNumber}.pdf`,
    };
  }

  async downloadXml(dto: DownloadFiscalDto, user: UserContext) {
    const sale = await this.getSale(dto.saleId);
    if (!sale || sale.companyId !== user.companyId) {
      throw new NotFoundException("Venda não encontrada");
    }

    const key = dto.type === "nfe" ? sale.nfeKey : sale.nfceKey;
    if (!key) {
      throw new BadRequestException(
        `Chave da ${dto.type.toUpperCase()} não encontrada`,
      );
    }

    const company = await this.getCompany(user.companyId);
    if (!company) {
      throw new NotFoundException("Empresa não encontrada");
    }

    const ambiente = this.getAmbiente(company.parametrosFiscais, dto.type);
    if (!ambiente) {
      throw new BadRequestException(
        `Ambiente fiscal para ${dto.type.toUpperCase()} não configurado`,
      );
    }

    const baseUrl =
      ambiente === "producao"
        ? "https://api.nuvemfiscal.com.br"
        : "https://api.sandbox.nuvemfiscal.com.br";
    const endpoint = `${baseUrl}/${dto.type}/${key}`;

    const token = await this.getNuvemFiscalToken();
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new InternalServerErrorException(
        result?.error || "Erro ao baixar XML da Nuvem Fiscal",
      );
    }

    return {
      success: true,
      xmlBase64: result.xml || result.xmlBase64 || result.data || null,
      filename: `${dto.type.toUpperCase()}_${sale.saleNumber}.xml`,
    };
  }

  async searchAddressByStreet(dto: SearchAddressDto) {
    const state = dto.state.trim().toUpperCase();
    const city = dto.city.trim();
    const street = dto.street.trim();

    if (!state || !city || !street) {
      throw new BadRequestException("State, city and street are required");
    }

    const endpoint = `https://brasilapi.com.br/api/cep/v2/${encodeURIComponent(state)}/${encodeURIComponent(city)}/${encodeURIComponent(street)}`;
    const response = await fetch(endpoint);

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(
        `Erro ao buscar endereço: ${text}`,
      );
    }

    return response.json();
  }

  private async emitFiscal(
    dto: EmitFiscalDto,
    user: UserContext,
    noteType: "nfe" | "nfce",
  ) {
    const sale = await this.getSale(dto.saleId);
    if (!sale) {
      throw new NotFoundException("Venda não encontrada");
    }
    if (sale.companyId !== user.companyId) {
      throw new NotFoundException(
        "Venda não encontrada para a empresa do usuário",
      );
    }

    if (!sale.items || sale.items.length === 0) {
      throw new BadRequestException("Venda sem itens para emissão");
    }

    const facilitador = await this.getFacilitador(dto.facilitadorId);
    if (!facilitador) {
      throw new NotFoundException("Facilitador fiscal não encontrado");
    }

    if (!facilitador.active) {
      throw new BadRequestException("Facilitador fiscal está inativo");
    }

    if (noteType === "nfe" && facilitador.modeloFiscal !== "55") {
      throw new BadRequestException(
        "Facilitador selecionado não é para NF-e (modelo 55)",
      );
    }

    if (noteType === "nfce" && facilitador.modeloFiscal !== "65") {
      throw new BadRequestException(
        "Facilitador selecionado não é para NFC-e (modelo 65)",
      );
    }

    const customer = await this.getCustomer(sale.personId);
    if (!customer) {
      throw new NotFoundException("Cliente não encontrado");
    }

    const company = await this.getCompany(user.companyId);
    if (!company) {
      throw new NotFoundException("Empresa não encontrada");
    }

    if (!company.parametrosFiscais) {
      throw new BadRequestException(
        "Parâmetros fiscais não configurados. Acesse Cadastros → Empresas e configure os parâmetros fiscais.",
      );
    }

    const params = company.parametrosFiscais as any;
    if (noteType === "nfe" && !params.emitirNfe) {
      throw new BadRequestException(
        "Emissão de NF-e não está habilitada nos parâmetros fiscais.",
      );
    }

    if (noteType === "nfce" && !params.emitirNfce) {
      throw new BadRequestException(
        "Emissão de NFC-e não está habilitada nos parâmetros fiscais.",
      );
    }

    if (!params.cnpj || !params.razaoSocial) {
      throw new BadRequestException(
        "CNPJ e Razão Social são obrigatórios nos parâmetros fiscais.",
      );
    }

    const ambiente = this.getAmbiente(params, noteType);
    const token = await this.getNuvemFiscalToken();
    const baseUrl =
      ambiente === "producao"
        ? "https://api.nuvemfiscal.com.br"
        : "https://api.sandbox.nuvemfiscal.com.br";
    const endpoint = `${baseUrl}/${noteType}`;
    const numeroSequencial =
      noteType === "nfe"
        ? params.numeroInicialNfe || 1
        : params.numeroInicialNfce || 1;

    const payload = this.buildPayload({
      sale,
      customer,
      company,
      facilitador,
      params,
      noteType,
      numeroSequencial,
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseData: any;
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (_error) {
      throw new InternalServerErrorException(
        "Erro ao processar resposta da Nuvem Fiscal: " + responseText,
      );
    }

    if (!response.ok) {
      throw new InternalServerErrorException(
        responseData?.error ||
          responseData ||
          "Erro ao emitir nota fiscal na Nuvem Fiscal",
      );
    }

    const updatePayload: any = {};
    if (noteType === "nfe") {
      updatePayload.nfeNumber = String(responseData.numero);
      updatePayload.nfeKey = responseData.chave;
      updatePayload.nfeDate = new Date();
    } else {
      updatePayload.nfceNumber = String(responseData.numero);
      updatePayload.nfceKey = responseData.chave;
      updatePayload.nfceDate = new Date();
    }

    await this.db
      .update(sales)
      .set(updatePayload)
      .where(eq(sales.id, dto.saleId));

    if (
      responseData.status === "autorizada" ||
      responseData.status === "autorizado"
    ) {
      const nextNumberField =
        noteType === "nfe" ? "numeroInicialNfe" : "numeroInicialNfce";
      const novoNumero = numeroSequencial + 1;
      await this.db
        .update(companies)
        .set({
          parametrosFiscais: {
            ...(company.parametrosFiscais as object),
            [nextNumberField]: novoNumero,
          },
        })
        .where(eq(companies.id, company.id));
    }

    return {
      success: true,
      message:
        responseData.status === "autorizada" ||
        responseData.status === "autorizado"
          ? `${noteType.toUpperCase()} emitida e autorizada com sucesso`
          : `${noteType.toUpperCase()} emitida mas não autorizada pela SEFAZ`,
      nfeNumber: noteType === "nfe" ? String(responseData.numero) : undefined,
      nfceNumber: noteType === "nfce" ? String(responseData.numero) : undefined,
      nfeKey: noteType === "nfe" ? responseData.chave : undefined,
      nfceKey: noteType === "nfce" ? responseData.chave : undefined,
      nfeUrl: noteType === "nfe" ? responseData.urlDanfe : undefined,
      nfceUrl: noteType === "nfce" ? responseData.urlDanfe : undefined,
      nfeXmlUrl: noteType === "nfe" ? responseData.urlXml : undefined,
      nfceXmlUrl: noteType === "nfce" ? responseData.urlXml : undefined,
      status: responseData.status,
    };
  }

  private async getSale(saleId: string) {
    const rows = await this.db.select().from(sales).where(eq(sales.id, saleId));
    return rows[0] || null;
  }

  private async getCompany(companyId: string) {
    const rows = await this.db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId));
    return rows[0] || null;
  }

  private async getCustomer(personId: string) {
    const rows = await this.db
      .select()
      .from(persons)
      .where(eq(persons.id, personId));
    return rows[0] || null;
  }

  private async getFacilitador(facilitadorId: string) {
    const rows = await this.db
      .select()
      .from(facilitadores)
      .where(eq(facilitadores.id, facilitadorId));
    return rows[0] || null;
  }

  private async getProduct(productId: string) {
    const rows = await this.db
      .select()
      .from(products)
      .where(eq(products.id, productId));
    return rows[0] || null;
  }

  private getAmbiente(parametros: any, noteType: "nfe" | "nfce") {
    if (!parametros) return null;
    return noteType === "nfe"
      ? parametros.ambienteNfe || "homologacao"
      : parametros.ambienteNfce || parametros.ambienteNfe || "homologacao";
  }

  private async getNuvemFiscalToken() {
    const clientId = this.config.get<string>("NUVEM_FISCAL_CLIENT_ID");
    const clientSecret = this.config.get<string>("NUVEM_FISCAL_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        "Credenciais da Nuvem Fiscal não configuradas",
      );
    }

    const response = await fetch(
      "https://auth.nuvemfiscal.com.br/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
          scope: "cep cnpj nfe nfce nfse cte mdfe",
        }),
      },
    );

    const body = await response.text();
    let tokenData: any;
    try {
      tokenData = body ? JSON.parse(body) : {};
    } catch (_error) {
      throw new InternalServerErrorException(
        "Erro ao processar autenticação da Nuvem Fiscal: " + body,
      );
    }

    if (!response.ok) {
      throw new InternalServerErrorException(
        tokenData?.error || "Erro ao autenticar na Nuvem Fiscal",
      );
    }

    if (!tokenData.access_token) {
      throw new InternalServerErrorException(
        "Token de autenticação da Nuvem Fiscal não retornado",
      );
    }

    return tokenData.access_token;
  }

  private cleanPhone(phone?: string | string[]) {
    if (!phone) return undefined;
    const raw = Array.isArray(phone) ? phone[0] : phone;
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 6 || digits.length > 14) {
      return undefined;
    }
    return digits;
  }

  private buildPayload(options: {
    sale: any;
    customer: any;
    company: any;
    facilitador: any;
    params: any;
    noteType: "nfe" | "nfce";
    numeroSequencial: number;
  }) {
    const {
      sale,
      customer,
      company,
      facilitador,
      params,
      noteType,
      numeroSequencial,
    } = options;

    const telefoneEmitente = this.cleanPhone(company.phone);
    const telefoneDestinatario = this.cleanPhone(
      Array.isArray(customer.phone) ? customer.phone[0] : customer.phone,
    );

    const enderEmit: any = {
      xLgr: company.address?.street || "Não informado",
      nro: company.address?.number || "S/N",
      xCpl: company.address?.complement || undefined,
      xBairro: company.address?.neighborhood || "Centro",
      cMun: company.address?.codigoMunicipio || "4115200",
      xMun: company.address?.city || "Não informado",
      UF: company.address?.state || "SP",
      CEP: String(company.address?.zipcode || "00000000").replace(/\D/g, ""),
    };
    if (telefoneEmitente) {
      enderEmit.fone = telefoneEmitente;
    }

    const enderDest: any = {
      xLgr: customer.address?.street || "Não informado",
      nro: customer.address?.number || "S/N",
      xCpl: customer.address?.complement || undefined,
      xBairro: customer.address?.neighborhood || "Centro",
      cMun: customer.address?.codigoMunicipio || "4115200",
      xMun: customer.address?.city || "Não informado",
      UF: customer.address?.state || "SP",
      CEP: String(customer.address?.zipcode || "00000000").replace(/\D/g, ""),
    };
    if (telefoneDestinatario) {
      enderDest.fone = telefoneDestinatario;
    }

    const ide: any = {
      cUF: this.mapearCodigoUF(company.address?.state || "SP"),
      natOp: facilitador.nome,
      mod: noteType === "nfe" ? 55 : 65,
      serie:
        parseInt(
          noteType === "nfe" ? params.serieNfe || "1" : params.serieNfce || "1",
          10,
        ) || 1,
      nNF: parseInt(String(numeroSequencial), 10),
      dhEmi: new Date(),
      tpNF: 1,
      idDest: 1,
      cMunFG: company.address?.codigoMunicipio || "4115200",
      tpImp: noteType === "nfe" ? 1 : 4,
      tpEmis: 1,
      tpAmb: this.getAmbiente(params, noteType) === "producao" ? 1 : 2,
      finNFe: 1,
      indFinal: 1,
      indPres: 1,
      procEmi: 0,
      verProc: "GDS Meu Gas 1.0",
    };

    const emit = {
      CNPJ: String(params.cnpj).replace(/\D/g, ""),
      xNome: params.razaoSocial,
      xFant: company.name,
      enderEmit,
      IE: params.inscricaoEstadual || "",
      CRT: parseInt(this.mapearRegimeTributario(params.regimeTributario), 10),
    };

    const dest: any = {
      xNome: customer.name,
      enderDest,
      indIEDest: 9,
    };
    const documentNumber = String(customer.document || "").replace(/\D/g, "");
    if (documentNumber.length === 11) {
      dest.CPF = documentNumber;
    } else if (documentNumber.length === 14) {
      dest.CNPJ = documentNumber;
    }

    return {
      ambiente:
        this.getAmbiente(params, noteType) === "producao"
          ? "producao"
          : "homologacao",
      referencia: sale.saleNumber,
      infNFe: {
        versao: "4.00",
        ide,
        emit,
        dest,
        det: sale.items.map((item: any, index: number) => ({
          nItem: index + 1,
          prod: {
            cProd: item.productCode || String(index + 1),
            cEAN: "SEM GTIN",
            xProd: item.productName,
            NCM: item.ncm || "00000000",
            CEST: item.cest || undefined,
            CFOP: item.cfop || facilitador.cfop,
            uCom: item.unidadeTributavel || "UN",
            qCom: item.quantity || 1,
            vUnCom: item.unitPrice || 0,
            vProd: item.total || 0,
            cEANTrib: "SEM GTIN",
            uTrib: item.unidadeTributavel || "UN",
            qTrib: item.quantity || 1,
            vUnTrib: item.unitPrice || 0,
            indTot: 1,
          },
          imposto: this.mapearImpostos(facilitador, null),
        })),
        total: {
          ICMSTot: {
            vBC: 0,
            vICMS: 0,
            vICMSDeson: 0,
            vFCP: 0,
            vBCST: 0,
            vST: 0,
            vFCPST: 0,
            vFCPSTRet: 0,
            vProd: sale.totalAmount || 0,
            vFrete: 0,
            vSeg: 0,
            vDesc: 0,
            vII: 0,
            vIPI: 0,
            vIPIDevol: 0,
            vPIS: 0,
            vCOFINS: 0,
            vOutro: 0,
            vNF: sale.totalAmount || 0,
            vTotTrib: 0,
          },
        },
        transp: { modFrete: 9 },
        pag: this.mapearPagamentos(
          sale.paymentMethods || [],
          sale.totalAmount || 0,
        ),
        infAdic: {
          infCpl:
            [params.observacoesNfe || "", sale.notes || ""]
              .filter(Boolean)
              .join("\n") ||
            "Documento emitido por ME/EPP optante pelo Simples Nacional.",
        },
        infRespTec: {
          CNPJ: "04954377000130",
          xContato: "Base44 Suporte",
          email: "suporte@base44.com",
          fone: "4135690005",
        },
      },
    };
  }

  private mapearCodigoUF(uf: string) {
    const codigos: Record<string, number> = {
      RO: 11,
      AC: 12,
      AM: 13,
      RR: 14,
      PA: 15,
      AP: 16,
      TO: 17,
      MA: 21,
      PI: 22,
      CE: 23,
      RN: 24,
      PB: 25,
      PE: 26,
      AL: 27,
      SE: 28,
      BA: 29,
      MG: 31,
      ES: 32,
      RJ: 33,
      SP: 35,
      PR: 41,
      SC: 42,
      RS: 43,
      MS: 50,
      MT: 51,
      GO: 52,
      DF: 53,
    };
    return codigos[uf.toUpperCase()] || 35;
  }

  private mapearRegimeTributario(regime: string) {
    const mapeamento: Record<string, string> = {
      simplesNacional: "1",
      simplesNacionalExcesso: "2",
      lucroPresumido: "3",
      lucroReal: "3",
      mei: "1",
      simples_nacional: "1",
      lucro_presumido: "3",
      lucro_real: "3",
    };
    return mapeamento[regime] || "1";
  }

  private mapearImpostos(facilitador: any, product: any) {
    const icmsCst =
      product?.icmsCst || facilitador.icmsSituacaoTributaria || "102";
    const pisCst = product?.pisCst || facilitador.pisSituacaoTributaria || "07";
    const cofinsCst =
      product?.cofinsCst || facilitador.cofinsSituacaoTributaria || "07";

    const impostos: any = {};

    impostos.ICMS = {
      ICMSSN102: {
        orig: product?.icmsOrigem || "0",
        CSOSN: icmsCst,
      },
    };

    impostos.PIS = {
      PISNT: {
        CST: pisCst,
      },
    };

    impostos.COFINS = {
      COFINSNT: {
        CST: cofinsCst,
      },
    };

    if (product?.valorIpi && Number(product.valorIpi) > 0) {
      impostos.IPI = {
        IPITrib: {
          CST: product.ipiSituacaoTributaria || "50",
          vBC: product.valorIpi,
          pIPI: 0,
          vIPI: product.valorIpi,
        },
      };
    }

    return impostos;
  }

  private mapearPagamentos(paymentMethods: any[], totalAmount: number) {
    if (!paymentMethods || paymentMethods.length === 0) {
      return {
        detPag: [{ tPag: "01", vPag: totalAmount }],
      };
    }

    const formasPagamentoMap: Record<string, string> = {
      dinheiro: "01",
      cheque: "02",
      cartaoCredito: "03",
      cartaoDebito: "04",
      pix: "17",
      transferencia: "18",
      boleto: "15",
      convenio: "99",
    };

    const detPag = paymentMethods.map((pm) => {
      const nomeLower = String(pm.paymentTypeName || "").toLowerCase();
      let tipoPag = "99";
      for (const [key, value] of Object.entries(formasPagamentoMap)) {
        if (nomeLower.includes(key)) {
          tipoPag = value;
          break;
        }
      }
      return {
        tPag: tipoPag,
        vPag: pm.amount || 0,
      };
    });

    return { detPag };
  }
}
