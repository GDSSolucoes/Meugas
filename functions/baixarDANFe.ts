import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Função para baixar o DANFE (PDF) de uma NF-e já emitida
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

    console.log('Baixando DANFE da venda:', sale_id);

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

    // Determinar ambiente (assumindo produção por padrão, mas pode ser configurado)
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

    // Baixar o PDF
    const pdfUrl = `${baseUrl}/nfe/${sale.nfe_key}/pdf`;
    console.log('Baixando PDF...');

    const pdfResponse = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/pdf'
      }
    });

    console.log('Status do download:', pdfResponse.status);

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text();
      console.error('Erro ao baixar PDF:', errorText);
      return Response.json({ 
        error: 'Erro ao baixar PDF da nota fiscal',
        details: errorText
      }, { status: pdfResponse.status });
    }

    // Ler o PDF em chunks
    const reader = pdfResponse.body.getReader();
    const chunks = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      chunks.push(value);
      totalBytes += value.length;
    }

    console.log(`Total de bytes lidos: ${totalBytes}`);

    // Combinar chunks em um único buffer
    const pdfBuffer = new Uint8Array(totalBytes);
    let offset = 0;
    
    for (const chunk of chunks) {
      pdfBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Verificar cabeçalho PDF
    const pdfHeader = String.fromCharCode(...pdfBuffer.slice(0, 4));
    if (!pdfHeader.startsWith('%PDF')) {
      console.error('Arquivo não é um PDF válido!');
      return Response.json({ 
        error: 'Arquivo baixado não é um PDF válido'
      }, { status: 500 });
    }

    console.log('PDF válido! Tamanho:', pdfBuffer.byteLength, 'bytes');

    // Converter para base64
    const base64Pdf = btoa(String.fromCharCode(...pdfBuffer));

    return Response.json({
      success: true,
      pdf_base64: base64Pdf,
      filename: `NF-e_${sale.nfe_number}_${sale.person_name}.pdf`,
      tamanho: pdfBuffer.byteLength,
      numero_nota: sale.nfe_number
    });

  } catch (error) {
    console.error('Erro ao baixar DANFE:', error);
    return Response.json({ 
      error: 'Erro interno ao baixar DANFE',
      details: error.message 
    }, { status: 500 });
  }
});