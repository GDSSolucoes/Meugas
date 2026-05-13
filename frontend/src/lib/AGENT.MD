# Lib

## Propósito

Fornecer infraestrutura compartilhada e suportar o estado global do frontend.

## O que faz

- `AuthContext.jsx`: autenticação e estado do usuário.
- `query-client.js`: instância do React Query.
- `utils.js`: helpers de utilitários transversais.
- `NavigationTracker.jsx` e `PageNotFound.jsx`: suporte de navegação e tratamento de rota.

## Diretrizes

- Contém apenas lógica de infraestrutura e contexto compartilhado.
- Novas funcionalidades transversais devem ser colocadas aqui.
- Não crie componentes de UI específicos que pertençam a uma única página.
- Mantenha `lib` como suporte para a aplicação inteira.
