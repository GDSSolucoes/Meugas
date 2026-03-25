# AGENT.md - Backend

## Propósito
Fornecer contexto sobre módulos backend, arquitetura de pastas e padrões de nomenclatura usados em `backend/src`.

## Visão de arquitetura
- Framework: NestJS 10
- Módulos principais:
  - `auth` (login, JWT, guards, roles)
  - `resources` (verticalização por domínio)
  - `common` (interceptors, filtros, request context)
  - `database` (config Drizzle, migrations, RLS, schemas)

## Diretório `src/auth`
- `auth.controller.ts`: endpoints de login/logout
- `auth.service.ts`: valida credenciais, emite token
- `jwt.strategy.ts`: valida token JWT
- `roles.guard.ts`, `roles.decorator.ts`: controle de acesso

## Diretório `src/resources`
- Cada subpasta corresponde a domínio (companies, people, products etc)
- Para cada domínio:
  - `<domain>.controller.ts` (endpoints REST)
  - `<domain>.service.ts` (lógica de negócio)
  - `<domain>.module.ts` (injeção e config do módulo)
  - `dto/` (objetos de transporte)
  - `entities/` (modelos de BD se existirem)

## Diretório `src/database`
- `database.module.ts`: provider de conexão com PostgreSQL e Drizzle
- `migrations/`: SQL e arquivos de migração + RLS
- `schemas/`: definição de tabelas e relações Drizzle
- `rls/`: políticas de Row-Level Security (se aplicável)

## Boas práticas de nomeação (backend)
- Módulos e classes: PascalCase (`CompaniesService`, `PeopleModule`)
- Arquivos: kebab-case (`companies.service.ts`)
- Variáveis e funções: camelCase
- Constantes: UPPER_SNAKE_CASE

## Rotas e endpoints
- Seguir RESTful: `GET /companies`, `POST /people`, `PATCH /products/:id`
- Autenticação: tenancy via JWT claim `companyId` e guardas de role

## Drizzle ORM e migrações
- Editar schemas em `src/database/schemas`
- `npm run drizzle:gen`
- Revisar SQL gerado em `src/database/migrations`
- `npm run drizzle:push`

## Indicadores de qualidade
- `npm run typecheck`
- test coverage (a implementar)

