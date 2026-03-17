import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Função para baixar o XML de uma NF-e já emitida
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
    const { sale_id } = await req.json();
    
    if (!sale_id) {
      return Response.json({ error: 'ID da venda não fornecido' }, { status: 400 });
    }

    console.log('Baixando XML da venda:', sale_id);

    // Buscar dados da venda
    const sales = await base44.asServiceRole.entities.Sale.filter({ id: sale_id });
    if (!sales || sales.length === 0) {
      return Response.json({ error: 'Venda não encontrada' }, { status: 404 });
    }
    const sale = sales[0];

    // Verificar se existe NF-e emitida
    if (!sale.nfe_key) {
      return Response.json({ 
        error: 'Não há NF-e emitida para esta venda'
      }, { status: 400 });
    }

    console.log('Chave NF-e:', sale.nfe_key);

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

    // Determinar ambiente (assumindo produção por padrão)
    const baseUrl = 'https://api.nuvemfiscal.com.br';

    // Consultar a nota para verificar status
    console.log('Consultando status da nota...');
    const consultaResponse = await fetch(`${baseUrl}/nfe/${sale.nfe_key}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`
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
        status_nota: notaData.status
      }, { status: 400 });
    }

    // Baixar o XML
    const xmlUrl = `${baseUrl}/nfe/${sale.nfe_key}/xml`;
    console.log('Baixando XML...');

    const xmlResponse = await fetch(xmlUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
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
        conteudo_recebido: xmlText.substring(0, 300)
      }, { status: 500 });
    }

    console.log('XML válido! Tamanho:', xmlText.length, 'caracteres');

    // Converter XML para base64
    const encoder = new TextEncoder();
    const xmlBytes = encoder.encode(xmlText);
    const base64Xml = btoa(String.fromCharCode(...xmlBytes));

    return Response.json({
      success: true,
      xml_base64: base64Xml,
      filename: `NF-e_${sale.nfe_number}_${sale.person_name}.xml`,
      tamanho: xmlText.length,
      numero_nota: sale.nfe_number,
      chave: sale.nfe_key
    });

  } catch (error) {
    console.error('Erro ao baixar XML:', error);
    return Response.json({ 
      error: 'Erro interno ao baixar XML',
      details: error.message 
    }, { status: 500 });
  }
});