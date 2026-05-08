# AGENT.md - Visão Geral do Projeto

## Objetivo
Documento central de referência técnica do projeto `gds-meu-gas`, descrevendo tecnologias, arquitetura, configuração e convenções. Perfeito para onboardings rápidos e alinhamento entre desenvolvedores.

## Tecnologias Principais
- Backend: NestJS 10, TypeScript, Drizzle ORM, PostgreSQL
- Autenticação: JWT com Passport (`passport-local`, `passport-jwt`)
- Documentação de API: Swagger (`@nestjs/swagger`, `swagger-ui-express`)
- Frontend: Vite + React (JSX), Tailwind, API via cliente `base44Client`
- Infra (futura): Docker / Kubernetes (não padrão atualmente)

## Configuração Geral
### 1. Variáveis de ambiente
- Backend: `backend/.env` com `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`
- Frontend: `.env` em root ou `frontend/.env` para `VITE_API_BASE_URL`

### 2. Instalação
- Backend: `cd backend && npm install`
- Frontend: `cd frontend && npm install`

### 3. Execução
- Backend: `npm run dev` dentro de `backend`
- Frontend: `npm run dev` dentro de `frontend`

## Arquitetura Geral
- Monorepo leve com dois pacotes (backend e frontend)
- Comunicação por API REST + JWT
- Backend organiza por módulos `resources` (DDD simplificado)
- Persistência via Drizzle / PostgreSQL com migrations

## Convenções de Código
- TypeScript estrito (sem `any` sempre que possível)
- Nomes de arquivo em kebab-case para rotas/recursos e camelCase para classes
- Módulos NestJS com `XModule`, `XService`, `XController`
- Regras de validação e DTOs em `src/resources/<...>/dto`

## Arquivos de estrutura específicos
- `backend/AGENT.MD`: descrição de cada módulo backend
- `frontend/AGENT.MD`: descrição da estrutura e componentes de UI

## Estilo de commits sugerido
- feat: nova funcionalidade
- fix: correção de bug
- docs: documentação
- chore: tarefas de manutenção

