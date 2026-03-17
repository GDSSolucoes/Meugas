# Backend - Migrações e RLS

## Drizzle Kit

- Configuração: `drizzle.config.ts` aponta para `src/database/schemas/index.ts` e escreve em `src/database/migrations`
- Scripts:
  - `npm run drizzle:gen` — gera migrações a partir dos Schemas Drizzle
  - `npm run drizzle:push` — aplica migrações ao banco
  - `npm run drizzle:introspect` — opcional, gera schemas a partir do banco

## Fluxo recomendado

- Alterar schemas em `src/database/schemas/*`
- Gerar migração: `npm run drizzle:gen`
- Revisar SQL gerado e complementar com regras avançadas (ex.: RLS)
- Aplicar: `npm run drizzle:push`

## RLS

- As políticas RLS não são geradas automaticamente — mantenha-as em arquivos SQL dedicados
- Já incluso:
  - `src/database/migrations/002_rls.sql` habilita e define políticas baseadas em `app.current_company_id`

## Requisitos

- `DATABASE_URL` no `.env`
- Extensão `pgcrypto` habilitada (UUID via `gen_random_uuid()`)
- Permissões de `GRANT` nas tabelas (ver `src/database/migrations/003_grants.sql`)
