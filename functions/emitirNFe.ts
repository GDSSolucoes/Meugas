
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Função para emitir NF-e (Nota Fiscal Eletrônica - Modelo 55)
 * Versão melhorada com numeração automática e validações completas
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validar autenticação do usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter dados da requisição
    const { sale_id, facilitador_id } = await req.json();
    
    if (!sale_id) {
      return Response.json({ error: 'ID da venda não fornecido' }, { status: 400 });
    }

    if (!facilitador_id) {
      return Response.json({ error: 'Facilitador fiscal é obrigatório' }, { status: 400 });
    }

    console.log('Iniciando emissão de NF-e para venda:', sale_id);

    // Buscar dados da venda
    const sales = await base44.asServiceRole.entities.Sale.filter({ id: sale_id });
    if (!sales || sales.length === 0) {
      return Response.json({ error: 'Venda não encontrada' }, { status: 404 });
    }
    const sale = sales[0];

    // Verificar se já existe NF-e emitida
    if (sale.nfe_number) {
      return Response.json({ 
        error: 'Já existe uma NF-e emitida para esta venda',
        nfe_number: sale.nfe_number,
        nfe_key: sale.nfe_key
      }, { status: 400 });
    }

    console.log('Venda encontrada:', sale.sale_number);

    // Buscar facilitador
    const facilitador = await base44.asServiceRole.entities.Facilitador.get(facilitador_id);
    
    if (!facilitador) {
      return Response.json({ error: 'Facilitador fiscal não encontrado' }, { status: 404 });
    }

    if (!facilitador.ativo) {
      return Response.json({ error: 'Facilitador fiscal está inativo' }, { status: 400 });
    }

    if (facilitador.modelo_fiscal !== '55') {
      return Response.json({ error: 'Facilitador selecionado não é para NF-e (modelo 55)' }, { status: 400 });
    }

    console.log('Facilitador encontrado:', facilitador.nome);

    // Buscar dados do cliente
    const customers = await base44.asServiceRole.entities.Person.filter({ id: sale.person_id });
    if (!customers || customers.length === 0) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }
    const customer = customers[0];

    console.log('Cliente encontrado:', customer.name);

    // Buscar dados da empresa
    const companies = await base44.asServiceRole.entities.Company.filter({ id: user.company_id });
    if (!companies || companies.length === 0) {
      return Response.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }
    const company = companies[0];

    // Validar parâmetros fiscais
    if (!company.parametros_fiscais) {
      return Response.json({ 
        error: 'Parâmetros fiscais não configurados. Acesse Cadastros → Empresas e configure os parâmetros fiscais.' 
      }, { status: 400 });
    }

    const params = company.parametros_fiscais;

    if (!params.emitir_nfe) {
      return Response.json({ 
        error: 'Emissão de NF-e não está habilitada nos parâmetros fiscais.' 
      }, { status: 400 });
    }

    if (!params.cnpj || !params.razao_social) {
      return Response.json({ error: 'CNPJ e Razão Social são obrigatórios nos parâmetros fiscais.' }, { status: 400 });
    }

    console.log('Parâmetros fiscais validados');

    // Preparar itens da nota (buscar detalhes dos produtos)
    const items = [];
    for (let i = 0; i < sale.items.length; i++) {
      const item = sale.items[i];
      
      // Buscar produto para obter dados fiscais
      const products = await base44.asServiceRole.entities.Product.filter({ id: item.product_id });
      const product = products && products.length > 0 ? products[0] : null;

      items.push({
        nItem: i + 1,
        prod: {
          cProd: item.product_code || String(i + 1),
          cEAN: 'SEM GTIN',
          xProd: item.product_name,
          NCM: product?.ncm || '00000000',
          CEST: product?.cest || undefined,
          CFOP: product?.cfop || facilitador.cfop,
          uCom: product?.unidade_tributavel || 'UN',
          qCom: item.quantity,
          vUnCom: item.unit_price,
          vProd: item.total,
          cEANTrib: 'SEM GTIN',
          uTrib: product?.unidade_tributavel || 'UN',
          qTrib: item.quantity,
          vUnTrib: item.unit_price,
          indTot: 1
        },
        imposto: mapearImpostos(facilitador, product, params.regime_tributario)
      });
    }

    // Obter credenciais
    const clientId = Deno.env.get('NUVEM_FISCAL_CLIENT_ID');
    const clientSecret = Deno.env.get('NUVEM_FISCAL_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return Response.json({ 
        error: 'Credenciais da Nuvem Fiscal não configuradas' 
      }, { status: 500 });
    }

    // Obter token OAuth2
    console.log('Autenticando com Nuvem Fiscal...');
    const tokenResponse = await fetch('https://auth.nuvemfiscal.com.br/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'cep cnpj nfe nfce nfse cte mdfe'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Erro na autenticação:', errorData);
      return Response.json({ 
        error: 'Erro ao autenticar na Nuvem Fiscal',
        details: errorData
      }, { status: 500 });
    }

    const { access_token } = await tokenResponse.json();
    console.log('Token obtido com sucesso');

    // Preparar telefone
    const limparTelefone = (telefone) => {
      if (!telefone) return '';
      const apenasNumeros = telefone.replace(/\D/g, '');
      if (apenasNumeros.length < 6 || apenasNumeros.length > 14) return '';
      return apenasNumeros;
    };

    const telefoneEmitente = limparTelefone(company.phone);

    // Montar endereço do emitente
    const enderEmit = {
      xLgr: company.address?.street || 'Não informado',
      nro: company.address?.number || 'S/N',
      xCpl: company.address?.complement || undefined,
      xBairro: company.address?.neighborhood || 'Centro',
      cMun: company.address?.codigo_municipio || '4115200',
      xMun: company.address?.city || 'Não informado',
      UF: company.address?.state || 'SP',
      CEP: company.address?.zipcode?.replace(/\D/g, '') || '00000000'
    };
    
    if (telefoneEmitente) {
      enderEmit.fone = telefoneEmitente;
    }

    // Montar endereço do destinatário
    const enderDest = {
      xLgr: customer.address?.street || 'Não informado',
      nro: customer.address?.number || 'S/N',
      xCpl: customer.address?.complement || undefined,
      xBairro: customer.address?.neighborhood || 'Centro',
      cMun: '4115200', // TODO: buscar código do município
      xMun: customer.address?.city || 'Não informado',
      UF: customer.address?.state || 'SP',
      CEP: customer.address?.zipcode?.replace(/\D/g, '') || '00000000'
    };

    const telefoneDestinatario = customer.phone && customer.phone.length > 0 
      ? limparTelefone(customer.phone[0]) 
      : '';
    
    if (telefoneDestinatario) {
      enderDest.fone = telefoneDestinatario;
    }

    // Número da nota (pega o próximo disponível)
    const numeroNFe = params.numero_inicial_nfe || 1;

    // Montar payload da NF-e
    const nfePayload = {
      ambiente: params.ambiente_nfe === 'producao' ? 'producao' : 'homologacao',
      referencia: sale.sale_number,
      
      infNFe: {
        versao: '4.00',
        
        ide: {
          cUF: mapearCodigoUF(company.address?.state || 'SP'),
          natOp: facilitador.nome,
          mod: 55, // NF-e
          serie: parseInt(params.serie_nfe) || 1,
          nNF: parseInt(numeroNFe),
          dhEmi: new Date().toISOString(),
          tpNF: 1, // Saída
          idDest: 1, // Operação interna
          cMunFG: company.address?.codigo_municipio || '4115200',
          tpImp: 1, // DANFE Retrato
          tpEmis: 1, // Normal
          tpAmb: params.ambiente_nfe === 'producao' ? 1 : 2,
          finNFe: 1, // Normal
          indFinal: 1, // Consumidor final
          indPres: 1, // Presencial
          procEmi: 0,
          verProc: 'Base44 1.0'
        },
        
        emit: {
          CNPJ: params.cnpj.replace(/\D/g, ''),
          xNome: params.razao_social,
          xFant: company.name,
          enderEmit: enderEmit,
          IE: params.inscricao_estadual || '',
          CRT: parseInt(mapearRegimeTributario(params.regime_tributario))
        },
        
        dest: {
          [customer.document?.length === 11 ? 'CPF' : 'CNPJ']: customer.document?.replace(/\D/g, '') || '',
          xNome: customer.name,
          enderDest: enderDest,
          indIEDest: 9 // Não contribuinte
        },
        
        det: items,
        
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
            vProd: sale.total_amount,
            vFrete: 0,
            vSeg: 0,
            vDesc: 0,
            vII: 0,
            vIPI: 0,
            vIPIDevol: 0,
            vPIS: 0,
            vCOFINS: 0,
            vOutro: 0,
            vNF: sale.total_amount,
            vTotTrib: 0
          }
        },
        
        transp: {
          modFrete: 9 // Sem frete
        },
        
        pag: mapearPagamentos(sale.payment_methods, sale.total_amount),
        
        infAdic: {
          infCpl: [
            params.observacoes_nfe || '',
            sale.notes || ''
          ].filter(Boolean).join('\n') || 'Documento emitido por ME/EPP optante pelo Simples Nacional.'
        },
        
        infRespTec: {
          CNPJ: '04954377000130',
          xContato: 'Base44 Suporte',
          email: 'suporte@base44.com',
          fone: '4135690005'
        }
      }
    };

    // Determinar ambiente
    const baseUrl = params.ambiente_nfe === 'homologacao' 
      ? 'https://api.sandbox.nuvemfiscal.com.br'
      : 'https://api.nuvemfiscal.com.br';

    const apiUrl = `${baseUrl}/nfe`;
    
    console.log('Ambiente:', params.ambiente_nfe);
    console.log('Enviando NF-e...');

    // Emitir NF-e
    const nfeResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nfePayload)
    });

    console.log('Status da resposta:', nfeResponse.status);

    const responseText = await nfeResponse.text();
    let nfeData;
    
    try {
      nfeData = JSON.parse(responseText);
    } catch (error) {
      console.error('Erro ao fazer parse da resposta:', error);
      return Response.json({ 
        error: 'Erro ao processar resposta da API',
        details: responseText
      }, { status: 500 });
    }

    if (!nfeResponse.ok) {
      console.error('Erro da Nuvem Fiscal:', JSON.stringify(nfeData, null, 2));
      return Response.json({ 
        error: 'Erro ao emitir nota fiscal na Nuvem Fiscal',
        details: nfeData
      }, { status: nfeResponse.status });
    }

    console.log('NF-e emitida com sucesso:', nfeData.numero);

    // Atualizar a venda com os dados da NF-e
    await base44.asServiceRole.entities.Sale.update(sale_id, {
      nfe_number: String(nfeData.numero),
      nfe_key: nfeData.chave,
      nfe_date: new Date().toISOString(),
      facilitador_id: facilitador_id
    });

    // Incrementar o número da próxima NF-e se foi autorizada
    if (nfeData.status === 'autorizada' || nfeData.status === 'autorizado') {
      const novoNumeroNFe = numeroNFe + 1;
      
      await base44.asServiceRole.entities.Company.update(company.id, {
        parametros_fiscais: {
          ...company.parametros_fiscais,
          numero_inicial_nfe: novoNumeroNFe
        }
      });
      
      console.log('NF-e autorizada! Próximo número atualizado para:', novoNumeroNFe);
    }

    return Response.json({
      success: true,
      message: nfeData.status === 'autorizada' || nfeData.status === 'autorizado' 
        ? 'NF-e emitida e autorizada com sucesso' 
        : 'NF-e emitida mas não autorizada pela SEFAZ',
      nfe_number: String(nfeData.numero),
      nfe_key: nfeData.chave,
      nfe_url: nfeData.url_danfe,
      nfe_xml_url: nfeData.url_xml,
      status: nfeData.status
    });

  } catch (error) {
    console.error('Erro ao emitir NF-e:', error);
    return Response.json({ 
      error: 'Erro ao processar emissão de NF-e', 
      details: error.message 
    }, { status: 500 });
  }
});

// Funções auxiliares
function mapearCodigoUF(uf) {
  const codigos = {
    'RO': 11, 'AC': 12, 'AM': 13, 'RR': 14, 'PA': 15, 'AP': 16, 'TO': 17,
    'MA': 21, 'PI': 22, 'CE': 23, 'RN': 24, 'PB': 25, 'PE': 26, 'AL': 27,
    'SE': 28, 'BA': 29, 'MG': 31, 'ES': 32, 'RJ': 33, 'SP': 35, 'PR': 41,
    'SC': 42, 'RS': 43, 'MS': 50, 'MT': 51, 'GO': 52, 'DF': 53
  };
  return codigos[uf] || 35;
}

function mapearRegimeTributario(regime) {
  const mapeamento = {
    'simples_nacional': '1',
    'simples_nacional_excesso': '2',
    'lucro_presumido': '3',
    'lucro_real': '3',
    'mei': '1'
  };
  return mapeamento[regime] || '1';
}

function mapearImpostos(facilitador, product, regimeTributario) {
  const icmsCst = product?.icms_cst || facilitador.icms_situacao_tributaria || '102';
  const pisCst = product?.pis_cst || facilitador.pis_situacao_tributaria || '07';
  const cofinsCst = product?.cofins_cst || facilitador.cofins_situacao_tributaria || '07';
  
  const impostos = {};

  // ICMS
  if (regimeTributario === 'simples_nacional' || regimeTributario === 'mei') {
    // Para Simples Nacional, verificar se precisa de benefício fiscal
    if (icmsCst === '400') {
      // CSOSN 400 - Não tributada pelo Simples Nacional
      impostos.ICMS = {
        ICMSSN400: {
          orig: product?.icms_origem || '0',
          CSOSN: icmsCst,
          // Benefício fiscal é obrigatório para CSOSN 400
          ...(product?.beneficio_fiscal && { vICMSDeson: 0, motDesICMS: 9 })
        }
      };
    } else {
      // Outros CSOSN
      impostos.ICMS = {
        ICMSSN102: {
          orig: product?.icms_origem || '0',
          CSOSN: icmsCst
        }
      };
    }
  } else {
    // Regime Normal (Lucro Presumido / Real)
    if (icmsCst === '40' || icmsCst === '41' || icmsCst === '50') {
      // CST 40 (Isenta), 41 (Não Tributada), 50 (Suspensão)
      impostos.ICMS = {
        ICMS40: {
          orig: product?.icms_origem || '0',
          CST: icmsCst,
          // Benefício fiscal quando aplicável
          ...(product?.beneficio_fiscal && { 
            vICMSDeson: 0, 
            motDesICMS: icmsCst === '40' ? 3 : (icmsCst === '41' ? 9 : 9)  // 3=Isenta, 9=Outros
          })
        }
      };
    } else {
      // CST 00 (Tributada Integralmente) e outros
      impostos.ICMS = {
        ICMS00: {
          orig: product?.icms_origem || '0',
          CST: icmsCst,
          modBC: 0,
          vBC: 0,
          pICMS: 0,
          vICMS: 0
        }
      };
    }
  }

  // Adicionar tag de benefício fiscal se disponível
  if (product?.beneficio_fiscal && (icmsCst === '40' || icmsCst === '41' || icmsCst === '50' || icmsCst === '400')) {
    // Adicionar xMot (descrição do motivo da desoneração) se necessário
    const icmsKey = Object.keys(impostos.ICMS)[0];
    impostos.ICMS[icmsKey].xMotDesICMS = `Benefício Fiscal: ${product.beneficio_fiscal}`;
  }

  // PIS
  impostos.PIS = {
    PISNT: {
      CST: pisCst
    }
  };

  // COFINS
  impostos.COFINS = {
    COFINSNT: {
      CST: cofinsCst
    }
  };

  // IPI (se aplicável)
  if (product?.valor_ipi && product.valor_ipi > 0) {
    impostos.IPI = {
      IPITrib: {
        CST: product.ipi_situacao_tributaria || '50',
        vBC: product.valor_ipi,
        pIPI: 0,
        vIPI: product.valor_ipi
      }
    };
  }

  return { imposto: impostos };
}

function mapearPagamentos(paymentMethods, totalAmount) {
  if (!paymentMethods || paymentMethods.length === 0) {
    return {
      detPag: [{
        tPag: '01', // Dinheiro
        vPag: totalAmount
      }]
    };
  }

  const formasPagamentoMap = {
    'dinheiro': '01',
    'cheque': '02',
    'cartao_credito': '03',
    'cartao_debito': '04',
    'pix': '17',
    'transferencia': '18',
    'boleto': '15',
    'convenio': '99'
  };

  const detPag = paymentMethods.map(pm => {
    // Tentar identificar o tipo de pagamento pelo nome
    let tipoPag = '99'; // Outros
    
    const nomeLower = (pm.payment_type_name || '').toLowerCase();
    for (const [key, value] of Object.entries(formasPagamentoMap)) {
      if (nomeLower.includes(key)) {
        tipoPag = value;
        break;
      }
    }

    return {
      tPag: tipoPag,
      vPag: pm.amount
    };
  });

  return { detPag };
}
