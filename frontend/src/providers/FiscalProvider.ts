import { api, apiEnabled } from '@/api/apiClient';

export class FiscalProvider {
  static async emitNFe(saleId: string, facilitadorId?: string) {
    if (!apiEnabled) {
      throw new Error('API não configurada');
    }

    try {
      const response = await api.post('/fiscal/emit-nfe', {
        saleId,
        facilitadorId
      });
      return response.data;
    } catch (error) {
      console.error('Erro emitindo NF-e:', error);
      throw error;
    }
  }

  static async emitNFCe(saleId: string, facilitadorId?: string) {
    if (!apiEnabled) {
      throw new Error('API não configurada');
    }

    try {
      const response = await api.post('/fiscal/emit-nfce', {
        saleId,
        facilitadorId
      });
      return response.data;
    } catch (error) {
      console.error('Erro emitindo NFC-e:', error);
      throw error;
    }
  }

  static async cancelFiscalNote(saleId: string, tipoNota: string, justificativa: string) {
    if (!apiEnabled) {
      throw new Error('API não configurada');
    }

    try {
      const response = await api.post('/fiscal/cancel-note', {
        saleId,
        tipoNota,
        justificativa
      });
      return response.data;
    } catch (error) {
      console.error('Erro cancelando nota fiscal:', error);
      throw error;
    }
  }

  static async downloadDanfe(saleId: string, type: 'nfe' | 'nfce') {
    if (!apiEnabled) {
      throw new Error('API não configurada');
    }

    try {
      const response = await api.post('/fiscal/download-danfe', {
        saleId,
        type
      });
      return response.data;
    } catch (error) {
      console.error('Erro baixando DANFE:', error);
      throw error;
    }
  }

  static async downloadXml(saleId: string, type: 'nfe' | 'nfce') {
    if (!apiEnabled) {
      throw new Error('API não configurada');
    }

    try {
      const response = await api.post('/fiscal/download-xml', {
        saleId,
        type
      });
      return response.data;
    } catch (error) {
      console.error('Erro baixando XML:', error);
      throw error;
    }
  }

  static async searchAddressByStreet(params: {
    state: string;
    city: string;
    street: string;
  }) {
    if (!apiEnabled) {
      throw new Error('API não configurada');
    }

    try {
      const response = await api.post('/fiscal/search-address', params);
      return response.data;
    } catch (error) {
      console.error('Erro buscando endereço pelo logradouro:', error);
      throw error;
    }
  }
}

export default FiscalProvider;
