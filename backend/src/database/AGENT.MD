# Database

## Propósito

Configuração do Drizzle ORM, conexão PostgreSQL, RLS e contexto de request-scoped DB.

## O que faz

- `database.module.ts`: provê `PG_POOL`, `DB`, `REQUEST_DB`, `RequestContextService`, `RlsService` e `RlsInterceptor`.
- `schemas/`: definições das tabelas Drizzle.
- `migrations/`: scripts e arquivos de migração do banco.
- `rls/`: lógica de Row-Level Security e contexto de empresa.
- `request-context.service.ts`: armazena o DB por request usando AsyncLocalStorage.

## Diretrizes

- Toda alteração de esquema começa em `schemas/`.
- Atualize migrações após mudar os schemas.
- Não contorne o proxy `DB` quando a aplicação depende de RLS.
- Use `RequestContextService` para obter o banco e o `companyId` no contexto.
- Mantenha as políticas de RLS consistentes com os claims JWT e o contexto de request.

## Quando criar algo novo aqui

- Novo provider de banco ou política de RLS.
- Novas tabelas via Drizzle sempre em `schemas/` acompanhadas de migração.
