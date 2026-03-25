# gds-meu-gas-backend

Backend para o projeto `gds-meu-gas` (NestJS + Drizzle ORM + PostgreSQL).

## 📌 Visão geral

Este repositório contém o servidor do sistema de gestão para postos (vendas, estoque, finanças e fiscal). Está construído com NestJS e usa Drizzle ORM para mapeamento de banco de dados, com autenticação JWT e endpoints REST documentados via Swagger.

## 🛠️ Pré-requisitos

- Node.js (recomendado >= 20)
- npm
- PostgreSQL
- .env configurado

## ⚙️ Instalação

```bash
cd backend
npm install
```

## 📁 Estrutura de pastas principal

- `src/`
  - `main.ts` (entrypoint)
  - `app.module.ts`
  - `auth/` (autenticação JWT, passport)
  - `common/` (interceptors, contexto de requisição)
  - `database/` (conexão, migrations, schemas)
  - `resources/` (módulos de domínio: people, companies, products, users etc)

- `drizzle.config.ts` (configuração do Drizzle ORM)

## 🔧 Variáveis de ambiente (`.env`)

Criar arquivo `.env` com algo como:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=uma_chave_secreta
PORT=3000
NODE_ENV=development
```

Adapte para seu ambiente local/produção.

## ▶️ Scripts

- `npm run dev` - desenvolvimento (ts-node-dev com reinício automático)
- `npm run build` - compila TypeScript via `tsc`
- `npm run start` - executa `node dist/main.js`
- `npm run typecheck` - checagem de tipos (`tsc --noEmit`)
- `npm run lint` - placeholder (ainda não há lint configurado)

Drizzle:
- `npm run drizzle:gen` - gera artefatos a partir dos Schemas Drizzle
- `npm run drizzle:push` - aplica migrações ao banco
- `npm run drizzle:introspect` - introspecção do banco para schema

## 🗄️ Banco de dados

Usa Drizzle ORM com configurações em `drizzle.config.ts`.

1. Verifique `DATABASE_URL` em `.env`
2. Execute `npm run drizzle:introspect` para rodar introspecção inicial (se precisar)
3. Crie/atualize migrações
4. Execute `npm run drizzle:push`

## 📘 Documentação da API (Swagger)

Ao executar o projeto em modo dev ou start:

`http://localhost:3000/api`
