# Entity Generator Script

Script para gerar automaticamente classes de entidade TypeScript para o frontend baseado nas definições do backend.

## 📋 O que o script faz

1. **Extrai propriedades** do arquivo DTO (`backend/src/resources/{entity}/dto/{entity}.base.dto.ts`)
2. **Extrai Enums e Interfaces** do arquivo Schema (`backend/src/database/schemas/{entity}.schema.ts`)
3. **Gera uma classe** TypeScript que estende `BaseEntity` com:
   - Todas as propriedades tipadas
   - Enums definidos
   - Interfaces para tipos complexos
   - Getters úteis
   - Métodos validados específicos da entidade

## 🚀 Uso

### Gerar uma única entidade

```bash
node generate-entity.js Order
```

Gera: `frontend/src/entities/Order.ts`

### Exemplo de Output

```typescript
import { BaseEntity } from "./BaseEntity";

export enum OrdersStatusEnum {
  PENDENTE = "pendente",
  EM_ATENDIMENTO = "em_atendimento",
  FINALIZADO = "finalizado",
  CANCELADO = "cancelado",
}

export class Order extends BaseEntity {
  companyId!: string;
  orderNumber!: string;
  personId!: string;
  personName?: string;
  // ... todas as propriedades do DTO
}
```

## 📝 Características

✅ **Extração automática de tipos** - Lê DTOs e Schemas do backend  
✅ **Enums preservados** - Copia enumerações automaticamente  
✅ **Interfaces complexas** - Gera tipos para objetos aninhados  
✅ **Date handling** - Converte strings para objetos Date automaticamente  
✅ **Métodos validados** - Adiciona validações específicas da entidade  
✅ **Getters úteis** - Adiciona cálculos e formatações comuns

## 🔧 Customizações

Se o script precisar de ajustes para uma entidade específica, edite manualmente após a geração, mas mantenha a estrutura base para consistência.
