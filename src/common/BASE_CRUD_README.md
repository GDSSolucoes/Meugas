# Base CRUD com RLS Integrado

## Visão Geral

A estrutura `BaseCrudService` e `BaseCrudController` foi ajustada para aproveitar o contexto de RLS (Row-Level Security) que já está implementado no `database.module.ts`.

## Mudanças Principais

### 1. **BaseCrudService**
- Agora injeta `RequestContextService` em vez de `@Inject('DB')`
- Obtém o database com RLS ativado via `this.requestContext.getDb()`
- Obtém o `companyId` automaticamente do contexto via `this.requestContext.getCompanyId()`
- **Não precisa mais receber `companyId` como parâmetro** - é obtido do contexto RLS
- As políticas de RLS filtram automaticamente por `company_id`

### 2. **BaseCrudController**
- Métodos não recebem mais `@CurrentUser()` para extrair `companyId`
- Chama serviço sem passar `companyId` - contexto é automático
- Exemplos de mudanças:

```typescript
// ANTES
async list(@CurrentUser() user: any, @Query('page') page: number = 1) {
  const companyId = user.companyId
  return this.service.list(companyId, page, 10, {})
}

// DEPOIS
async list(@Query('page') page: number = 1) {
  return this.service.list(page, 10, {})
}
```

## Como Adicionar Nova Entidade

### 1. Criar DTOs

```typescript
// src/resources/[entity]/dto/[entity].post.dto.ts
import { ApiProperty } from '@nestjs/swagger'

export class [Entity]PostDto {
  @ApiProperty()
  name!: string
  // ... outros campos
}
```

### 2. Criar Service

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

### 3. Criar Controller

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

### 4. Criar Module

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

### 5. Registrar no AppModule

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
   - Executa a função dentro d

o contexto via `RequestContextService`
   - Commit/Rollback automático
5. **RequestContextService** armazena `db`, `client`, `companyId` em AsyncLocalStorage
6. **BaseCrudService** obtém o db do contexto e todas as queries são automaticamente filtradas

### Benefícios

- ✅ Segurança garantida - queries sempre filtram por `company_id` em nível de banco
- ✅ Sem passar `companyId` manualmente entre camadas
- ✅ Menor chance de bug de isolamento de dados
- ✅ Performance - filtro aplicado no banco, não na aplicação

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

## Exemplo Completo: Fueling

```typescript
// Service
@Injectable()
export class FuelingService extends BaseCrudService<typeof fuelings> {
  constructor(requestContext: RequestContextService) {
    super(requestContext, fuelings, true)
  }
}

// Controller
@Controller('fuelings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('fuelings')
export class FuelingController extends BaseCrudController<any> {
  constructor(readonly fuelingService: FuelingService) {
    super(fuelingService, 'Fueling', true)
  }
}

// Module
@Module({
  providers: [FuelingService],
  controllers: [FuelingController],
})
export class FuelingModule {}
```

## Observações Importantes

1. **Fields Required**: Todo schema deve ter `active` (boolean, default true)
2. **Company Isolation**: Se a entidade é multi-tenant, passe `true` como `hasCompanyId`
3. **Custom Logic**: Extend `BaseCrudService` para adicionar lógica específica
4. **Search Fields**: Customize em cada Service se necessário
5. **RLS ativado**: O interceptor RLS deve estar ativo para que o contexto funcione
