# AGENT.md - Frontend

## Propósito
Explicar arquitetura, responsabilidades de pastas e padrões de naming do frontend React/Vite.

## Arquitetura geral do frontend
- Vite + React + JSX
- Estrutura em `src/`
- Roteamento com configuração central (`src/pages.config.js` e `src/components`)
- Comunicação API com `src/api/base44Client.js` + `src/lib/apiClient.js`

## Pastas principais
- `src/pages/` - páginas da aplicação (Dashboard, Cadastro, Movimentações)
- `src/components/` - componentes UI reutilizáveis + domain-specific
- `src/lib/` - lógica de apoio (AuthContext, query client, utilitários)
- `src/functions/` (na raiz) - funções serverless (emulação de backend remoto ou ações fiscais)

## Convenções de naming (frontend)
- Componentes: PascalCase (`UserNotRegisteredError.jsx`)
- Hooks: use<Nome> (`useMobile.jsx`)
- Arquivos de utilitário: kebab-case (`apiClient.js`, `app-params.js`)
- CSS/Tailwind via classes utilitárias e `index.css` global

## Padrões de módulo
- Cada funcionalidade importante (acerto, financeiro, vendas) tem pasta própria
- Componentes pequenos e específicos em subpastas (`components/acerto`, `components/sales`)
- Paginas em `src/pages` se ligam a rotas e chamadas `api`

## API e estado
- React Query via `src/lib/query-client.js` (caching + invalidação)
- Consumir endpoints do backend via `base44Client` e `ApiErrorToaster` para erros
- Contexto de autenticação em `src/lib/AuthContext.jsx`

## Execução local
- `cd frontend`
- `npm install`
- `npm run dev` (servidor de desenvolvimento)

## Boas práticas
- UI acessível e responsiva em mobile (ganchos em `use-mobile.jsx`)
- Separar lógica de UI e de dados (componentes puros + hooks de data fetch)
- Mensagens de erro e loading states claros

