import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Função para cancelar uma NF-e ou NFC-e já emitida
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Validar autenticação do usuário
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas admins podem cancelar notas
    if (user.userType !== 'admin') {
      return Response.json({ 
        error: 'Apenas administradores podem cancelar notas fiscais' 
      }, { status: 403 });
    }

    // Obter dados da requisição
    const { saleId, tipoNota, justificativa } = await req.json();
    
    if (!saleId || !tipoNota || !justificativa) {
      return Response.json({ 
        error: 'ID da venda, tipo de nota e justificativa são obrigatórios' 
      }, { status: 400 });
    }

    if (justificativa.length < 15) {
      return Response.json({ 
        error: 'Justificativa deve ter no mínimo 15 caracteres' 
      }, { status: 400 });
    }

    console.log('Cancelando nota da venda:', saleId, 'Tipo:', tipoNota);

    // Buscar dados da venda
    const sales = await base44.asServiceRole.entities.Sale.filter({ id: saleId });
    if (!sales || sales.length === 0) {
      return Response.json({ error: 'Venda não encontrada' }, { status: 404 });
    }
    const sale = sales[0];

    // Verificar se existe nota emitida
    const chaveNota = tipoNota === 'nfe' ? sale.nfeKey : sale.nfceKey;
    if (!chaveNota) {
      return Response.json({ 
        error: `Não há ${tipoNota.toUpperCase()} emitida para esta venda`
      }, { status: 400 });
    }

    console.log(`Chave ${tipoNota.toUpperCase()}:`, chaveNota);

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

    // Determinar ambiente e endpoint correto
    const baseUrl = 'https://api.nuvemfiscal.com.br';
    const endpoint = tipoNota === 'nfe' ? 'nfe' : 'nfce';

    // Cancelar nota na Nuvem Fiscal
    console.log('Enviando cancelamento...');
    const cancelUrl = `${baseUrl}/${endpoint}/${chaveNota}/cancelamento`;
    
    const cancelResponse = await fetch(cancelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        justificativa: justificativa
      })
    });

    const cancelData = await cancelResponse.json();

    if (!cancelResponse.ok) {
      console.error('Erro ao cancelar:', cancelData);
      return Response.json({ 
        error: 'Erro ao cancelar nota fiscal',
        details: cancelData
      }, { status: cancelResponse.status });
    }

    console.log('Nota cancelada com sucesso!');

    // Atualizar venda com status de cancelamento
    const updateData = {};
    if (tipoNota === 'nfe') {
      updateData.nfeCancelada = true;
      updateData.nfeDataCancelamento = new Date().toISOString();
      updateData.nfeJustificativaCancelamento = justificativa;
    } else {
      updateData.nfceCancelada = true;
      updateData.nfceDataCancelamento = new Date().toISOString();
      updateData.nfceJustificativaCancelamento = justificativa;
    }

    await base44.asServiceRole.entities.Sale.update(saleId, updateData);

    return Response.json({
      success: true,
      message: `${tipoNota.toUpperCase()} cancelada com sucesso`,
      protocolo: cancelData.protocolo
    });

  } catch (error) {
    console.error('Erro ao cancelar nota:', error);
    return Response.json({ 
      error: 'Erro interno ao cancelar nota',
      details: error.message 
    }, { status: 500 });
  }
});