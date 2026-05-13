# API

## Propósito

Conter a camada de comunicação HTTP com o backend.

## O que faz

- `apiClient.js`: cria instância Axios com `baseURL` e cabeçalhos JSON.
- Adiciona token Bearer automaticamente a todas as requisições.
- Trata refresh de token quando recebe `401`.
- Dispara evento global `api-error` para falhas de API.

## Diretrizes

- Não implementar UI ou lógica de renderização aqui.
- Manter somente integração com endpoints e tratamento de autenticação.
- Use `apiEnabled` para garantir que a aplicação só use API se a URL estiver configurada.
- Não misture regras de negócio do domínio com a lógica de transporte.
