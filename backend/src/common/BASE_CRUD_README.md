# Base CRUD com RLS Integrado

## Visão Geral

A estrutura `BaseCrudService` e `BaseCrudController` foi ajustada para aproveitar o contexto de RLS (Row-Level Security) que já está implementado no `database.module.ts`.

## Como Adicionar Nova Entidade

## Endpoints Padrão

Cada entidade com CRUD genérico terá:

```
GET    /api/[entities]                    - Listar (com paginação e filtros)
GET    /api/[entities]/:id                - Obter por ID
POST   /api/[entities]                    - Criar
PUT    /api/[entities]/:id                - Atualizar
DELETE /api/[entities]/:id                - Deletar (soft-delete)
```

### Query Parameters

```
GET /api/vehicles?page=1&limit=10&q=Honda&plate_like=ABC

- page: número da página (default: 1)
- limit: itens por página (default: 10)
- q: busca por campos definidos (ex: name, plate)
- campo_like: busca contém (ex: plate_like=ABC)
- campo_gt: greater than (ex: year_gt=2020)
- campo_lt: less than (ex: year_lt=2020)
- campo_eq: igual (ex: status_eq=ativo)
```

### 1. Verificar se a maquina possui ambiente python configurado

### 2. Se possui python instalado:

#### 2.1 Criar definição do schema

```typescript
// src/database/schemas/[entity].schema.ts
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";

export const [entity] = pgTable(
  "entity",
  {
    // Propriedades base, obrigatórias
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    active: boolean("active").default(true),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
    //... outras propriedades
  },
  (table) => [
    pgPolicy("[entity]_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
  ],
);
```

#### 2.2 Executar script para geração de CRUD

```shell
python scripts/generate_crud.py
```

#### 2.3 Conferir arquivos gerados.

- Conferir se foi gerado adequadamente os DTOs, service, controller e module na pasta `src/resources/[entity]`
- Conferir se o modulo foi registrado em `src/app.module.ts`

### 3. Se não existir ambiente python

Precisa criar os arquivos manualmente, seguindo a arquitetura padrão

#### 3.1 Criar definição do schema

```typescript
// src/database/schemas/[entity].schema.ts
import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { companies } from "./company.schema";
import { sql } from "drizzle-orm/sql/sql";

export const [entity] = pgTable(
  "entity",
  {
    // Propriedades base, obrigatórias
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    companyName: text("company_name"),
    active: boolean("active").default(true),
    createdByName: text("created_by_name"),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).defaultNow(),
    //... outras propriedades
  },
  (table) => [
    pgPolicy("[entity]_tenant_isolation", {
      for: "all",
      as: "permissive",
      to: "public",
      using: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
      withCheck: sql`company_id = current_setting('app.current_company_id', true)::uuid`,
    }),
  ],
);
```

#### 3.2. Criar DTOs

```typescript
// src/resources/[entity]/dto/[entity].post.dto.ts
import { ApiProperty } from '@nestjs/swagger'

export class [Entity]PostDto {
  @ApiProperty()
  name!: string
  // ... outros campos
}
```

#### 3.3. Criar Service

```typescript
// src/resources/[entity]/[entity].service.ts
import { Injectable } from '@nestjs/common'
import { BaseCrudService } from '../../common/base-crud.service'
import { RequestContextService } from '../../database/request-context.service'
import { [entities] } from '../../database/schemas'
import { [Entity]PostDto } from './dto/[entity].post.dto'
import { [Entity]UpdateDto } from './dto/[entity].update.dto'

@Injectable()
export class [Entity]Service extends BaseCrudService<typeof [entities]> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, [entities], true) // true = has companyId
  }
}
```

#### 3.4. Criar Controller

```typescript
// src/resources/[entity]/[entity].controller.ts
import { Controller, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import { RolesGuard } from '../../auth/roles.guard'
import { BaseCrudController } from '../../common/base-crud.controller'
import { [Entity]Service } from './[entity].service'

@Controller('[entities]')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('[entities]')
export class [Entity]Controller extends BaseCrudController<any> {
  constructor(readonly [entity]Service: [Entity]Service) {
    super([entity]Service, '[Entity]', true)
  }
}
```

#### 3.5. Criar Module

```typescript
// src/resources/[entity]/[entity].module.ts
import { Module } from '@nestjs/common'
import { [Entity]Service } from './[entity].service'
import { [Entity]Controller } from './[entity].controller'

@Module({
  providers: [[Entity]Service],
  controllers: [[Entity]Controller],
})
export class [Entity]Module {}
```

#### 3.6. Registrar no AppModule

```typescript
// src/app.module.ts
import { [Entity]Module } from './resources/[entity]/[entity].module'

@Module({
  imports: [
    // ... outros imports
    [Entity]Module,
  ],
})
export class AppModule {}
```

## RLS (Row-Level Security) - Como Funciona

### Flow

1. **RLS Interceptor** (`rls.interceptor.ts`) intercepta requisições HTTP
2. Extrai `companyId` do JWT token
3. Chama `RlsService.withCompany(companyId, fn)`
4. `RlsService.withCompany`:
   - Conecta ao banco com cliente dedicado
   - Executa `SET app.current_company_id = companyId`
   - Executa a função dentro do contexto via `RequestContextService`
   - Commit/Rollback automático
5. **RequestContextService** armazena `db`, `client`, `companyId` em AsyncLocalStorage
6. **BaseCrudService** obtém o db do contexto e todas as queries são automaticamente filtradas

### Benefícios

- ✅ Segurança garantida - queries sempre filtram por `company_id` em nível de banco
- ✅ Sem passar `companyId` manualmente entre camadas
- ✅ Menor chance de bug de isolamento de dados
- ✅ Performance - filtro aplicado no banco, não na aplicação

## Observações Importantes

1. **Fields Required**: Todo schema deve ter `active` (boolean, default true)
2. **Company Isolation**: Se a entidade é multi-tenant, passe `true` como `hasCompanyId`
3. **Custom Logic**: Extend `BaseCrudService` para adicionar lógica específica
4. **Search Fields**: Customize em cada Service se necessário
5. **RLS ativado**: O interceptor RLS deve estar ativo para que o contexto funcione
