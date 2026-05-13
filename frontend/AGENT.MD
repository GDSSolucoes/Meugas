# AGENT.md - Frontend

## Propósito

Explicar a arquitetura, responsabilidades de pastas e padrões de desenvolvimento do frontend React/Vite.

## Arquitetura geral do frontend

- Vite + React + JSX
- Estrutura centrada em `src/`
- Comunicação com backend via `src/api/apiClient.js`
- Estado e cache com React Query em `src/lib/query-client.js`
- Autenticação compartilhada em `src/lib/AuthContext.jsx`

## Pastas principais

- `src/pages/` - páginas/rotas da aplicação
- `src/components/` - componentes reutilizáveis e domain-specific
- `src/api/` - cliente HTTP e integração com backend
- `src/lib/` - infraestrutura compartilhada, contextos e utilitários globais
- `src/entities/` - modelos/entidades tipadas do domínio
- `src/hooks/` - hooks customizados
- `src/providers/` - wrappers de serviços e integrações específicas
- `src/utils/` - funções utilitárias puras

## Convenções de naming (frontend)

- Componentes: PascalCase (`UserNotRegisteredError.jsx`)
- Hooks: `use<Nome>` (`useMobile.jsx`)
- Arquivos de utilitário: kebab-case (`api-client.js`, `app-params.js`)
- Páginas: PascalCase e correspondem a rotas (`Dashboard.jsx`, `SalesReport.jsx`)
- Arquivos de provedor: PascalCase ou `Provider` no fim do nome

## Padrões de responsabilidade

- `src/pages`: orquestram componentes e chamadas de dados, representam telas.
- `src/components`: UI e blocos reutilizáveis, sem lógica de roteamento ou fetch complexa.
- `src/api`: cliente HTTP, interceptors, refresh de token e tratamento global de erro.
- `src/lib`: contexto de aplicação, query client, utilidades transversais.
- `src/entities`: tipos e classes que representam entidades de backend.
- `src/hooks`: lógica de comportamento, detecção de ambiente e hooks de UX.
- `src/providers`: serviços que encapsulam regras de integração (como fiscal).
- `src/utils`: helpers puros e pequenos utilitários usados por todo o app.

## Boas práticas

- Separar UI de lógica de dados: components + hooks + API
- Manter o frontend compatível com o backend via `src/entities`
- Tratar erros globais no cliente HTTP e notificar via evento
- Usar hooks para abstrair comportamento reutilizável
- Evitar lógica de negócio de domínio em `src/components`

## Execução local

- `cd frontend`
- `npm install`
- `npm run dev`
