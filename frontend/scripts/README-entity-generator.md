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
import { BaseEntity } from './BaseEntity';

export enum OrdersStatusEnum {
  PENDENTE = 'pendente',
  EM_ATENDIMENTO = 'em_atendimento',
  FINALIZADO = 'finalizado',
  CANCELADO = 'cancelado',
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

## 🎯 Próximos passos

1. Validar `Order.ts` gerado
2. Executar para outras entidades:
   ```bash
   node generate-entity.js Product
   node generate-entity.js Sale
   node generate-entity.js Person
   node generate-entity.js CashAccount
   # ... etc
   ```
3. Atualizar imports nos componentes que usam essas entidades

## 🔧 Customizações

Se o script precisar de ajustes para uma entidade específica, edite manualmente após a geração, mas mantenha a estrutura base para consistência.

## 📚 Entidades a Gerar

Baseado no backend, as entidades a gerar são:
- Order ✅ (já existe)
- Person (já existe)
- Product
- Sale
- Purchase
- CashAccount
- CashMovement
- Sector
- Employee
- PaymentType
- Acquirer
- Facilitador
- Budget
- AccountsReceivable
- ContasAPagar
- ProductPickup
- VasilhameLoan
- StockTransfer
- ProductStock
- SectorMaster
- FinancialGroup
- FinancialSubgroup
- Fueling

## 🐛 Troubleshooting

**Script não encontra arquivo DTO/Schema?**
- Verifique se o caminho é correto: `backend/src/resources/{entity.lowercase}s/`
- Certifique-se que a entidade existe no backend

**Proprietário não foi detectado?**
- Verifique se o DTO segue o padrão de classe com decoradores `@IsOptional()` ou `@IsNotEmpty()`
- Execute `npm run typecheck` no backend para validar DTOs