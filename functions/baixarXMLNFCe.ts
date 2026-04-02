import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Função para baixar o XML de uma NFC-e já emitida
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
    const { saleId } = await req.json();
    
    if (!saleId) {
      return Response.json({ error: 'ID da venda não fornecido' }, { status: 400 });
    }

    console.log('Baixando XML da venda (NFC-e):', saleId);

    // Buscar dados da venda
    const sales = await base44.asServiceRole.entities.Sale.filter({ id: saleId });
    if (!sales || sales.length === 0) {
      return Response.json({ error: 'Venda não encontrada' }, { status: 404 });
    }
    const sale = sales[0];

    // Verificar se existe NFC-e emitida
    if (!sale.nfceKey) {
      return Response.json({ 
        error: 'Não há NFC-e emitida para esta venda'
      }, { status: 400 });
    }

    console.log('Chave NFC-e:', sale.nfceKey);

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
        grantType: 'clientCredentials',
        clientId: clientId,
        clientSecret: clientSecret,
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

    const { accessToken } = await tokenResponse.json();
    console.log('Token obtido com sucesso');

    // Determinar ambiente (assumindo produção por padrão)
    const baseUrl = 'https://api.nuvemfiscal.com.br';

    // Consultar a nota para verificar status
    console.log('Consultando status da nota...');
    const consultaResponse = await fetch(`${baseUrl}/nfce/${sale.nfceKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!consultaResponse.ok) {
      const errorData = await consultaResponse.text();
      console.error('Erro ao consultar nota:', errorData);
      return Response.json({ 
        error: 'Erro ao consultar nota fiscal',
        details: errorData
      }, { status: consultaResponse.status });
    }

    const notaData = await consultaResponse.json();
    console.log('Status da nota:', notaData.status);

    // Verificar se a nota foi autorizada
    if (notaData.status !== 'autorizado' && notaData.status !== 'autorizada') {
      return Response.json({ 
        error: 'A nota fiscal ainda não foi autorizada pela SEFAZ',
        details: `Status atual: ${notaData.status}`,
        statusNota: notaData.status
      }, { status: 400 });
    }

    // Baixar o XML
    const xmlUrl = `${baseUrl}/nfce/${sale.nfceKey}/xml`;
    console.log('Baixando XML...');

    const xmlResponse = await fetch(xmlUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/xml, text/xml'
      }
    });

    console.log('Status do download:', xmlResponse.status);

    if (!xmlResponse.ok) {
      const errorText = await xmlResponse.text();
      console.error('Erro ao baixar XML:', errorText);
      return Response.json({ 
        error: 'Erro ao baixar XML da nota fiscal',
        details: errorText
      }, { status: xmlResponse.status });
    }

    // Ler o XML como texto
    const xmlText = await xmlResponse.text();
    console.log('Tamanho do XML:', xmlText.length, 'caracteres');

    // Validar XML
    if (xmlText.length < 100) {
      console.warn('XML muito pequeno!');
      return Response.json({ 
        error: 'XML retornado está vazio ou corrompido',
        tamanho: xmlText.length
      }, { status: 500 });
    }

    if (!xmlText.trim().startsWith('<?xml') && !xmlText.trim().startsWith('<')) {
      console.error('Conteúdo não é XML válido!');
      return Response.json({ 
        error: 'Conteúdo baixado não é um XML válido',
        conteudoRecebido: xmlText.substring(0, 300)
      }, { status: 500 });
    }

    console.log('XML válido! Tamanho:', xmlText.length, 'caracteres');

    // Converter XML para base64
    const encoder = new TextEncoder();
    const xmlBytes = encoder.encode(xmlText);
    const base64Xml = btoa(String.fromCharCode(...xmlBytes));

    return Response.json({
      success: true,
      xmlBase64: base64Xml,
      filename: `NFC-e_${sale.nfceNumber}_${sale.personName}.xml`,
      tamanho: xmlText.length,
      numeroNota: sale.nfceNumber,
      chave: sale.nfceKey
    });

  } catch (error) {
    console.error('Erro ao baixar XML:', error);
    return Response.json({ 
      error: 'Erro interno ao baixar XML',
      details: error.message 
    }, { status: 500 });
  }
});