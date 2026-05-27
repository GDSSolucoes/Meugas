# CRUD Generator Guide

Script melhorado para gerar e regenerar CRUD modules para entidades NestJS + Drizzle ORM.

## Funcionalidades

✨ **Novas capacidades:**

- ✅ Regenerar CRUD para entidades existentes
- ✅ Escolher componentes específicos para gerar (DTO, Service, Controller)
- ✅ Modo interativo com menu de seleção
- ✅ Modo automático com flags de linha de comando
- ✅ Modo dry-run para visualizar mudanças sem criar arquivos

## Uso

### 1. Modo Interativo (Recomendado)

Execute sem argumentos para modo interativo:

```bash
python scripts/generate_crud.py
```

O script irá:

1. Listar todas as entidades disponíveis
2. Permitir escolher qual entidade gerar/regenerar
3. Permitir escolher quais componentes gerar

### 2. Gerar Todas as Novas Entidades

```bash
python scripts/generate_crud.py --no-interactive
```

### 3. Regenerar Entidade Específica

#### Regenerar com todos os componentes:

```bash
python scripts/generate_crud.py --entity products --regenerate
```

#### Regenerar apenas DTOs:

```bash
python scripts/generate_crud.py --entity products --only-dto --regenerate
```

#### Regenerar apenas Service:

```bash
python scripts/generate_crud.py --entity products --only-service --regenerate
```

#### Regenerar apenas Controller:

```bash
python scripts/generate_crud.py --entity products --only-controller --regenerate
```

### 4. Combinações de Componentes

#### DTOs + Service:

```bash
python scripts/generate_crud.py --entity orders --only-dto --only-service --regenerate
```

#### DTOs + Controller:

```bash
python scripts/generate_crud.py --entity employees --only-dto --only-controller --regenerate
```

#### Todos os componentes (padrão):

```bash
python scripts/generate_crud.py --entity users --regenerate
```

### 5. Modo Dry Run (Visualizar sem criar)

```bash
python scripts/generate_crud.py --entity products --only-dto --dry-run
```

Isso mostra exatamente o que seria gerado **sem** criar os arquivos.

## Exemplos de Uso Completo

### Exemplo 1: Atualizar apenas DTOs de uma entidade existente

```bash
python scripts/generate_crud.py --entity invoices --only-dto --regenerate
```

**O que acontece:**

- Regenera os DTOs: `base.dto.ts`, `post.dto.ts`, `update.dto.ts`, `delete.dto.ts`, `list.dto.ts`
- Preserva o Service e Controller existentes
- Não atualiza o Module

### Exemplo 2: Gerar novo entidade com todos os componentes

```bash
python scripts/generate_crud.py --entity payments --regenerate
```

**O que acontece:**

- Cria todos os DTOs
- Cria o Service
- Cria o Controller
- Cria o Module
- Atualiza o `app.module.ts`

### Exemplo 3: Verificar antes de gerar (Dry Run)

```bash
python scripts/generate_crud.py --entity vendors --dry-run --no-interactive
```

**O que acontece:**

- Mostra exatamente quais arquivos seriam criados
- Mostra preview do conteúdo
- **Nenhum arquivo é criado**

### Exemplo 4: Atualizar Service após mudanças na lógica

```bash
python scripts/generate_crud.py --entity shipments --only-service --regenerate
```

**O que acontece:**

- Regenera apenas o arquivo `shipments.service.ts`
- DTOs, Controller e Module permanecem intactos

## Argumentos Disponíveis

| Argumento           | Descrição                                                 |
| ------------------- | --------------------------------------------------------- |
| `--entity ENTITY`   | Especifica qual entidade gerar/regenerar (nome da tabela) |
| `--regenerate`      | Força regeneração de entidade já existente                |
| `--only-dto`        | Gera apenas arquivos DTO                                  |
| `--only-service`    | Gera apenas Service                                       |
| `--only-controller` | Gera apenas Controller                                    |
| `--dry-run`         | Visualiza mudanças sem criar arquivos                     |
| `--no-interactive`  | Pula modo interativo e usa padrões/argumentos             |
| `-h, --help`        | Mostra ajuda com todos os comandos                        |

## Componentes Gerados

### DTOs

- `{entity}.base.dto.ts` - DTO base com todas as propriedades de leitura
- `{entity}.post.dto.ts` - DTO para criação (extends BaseDto)
- `{entity}.update.dto.ts` - DTO para atualização (PartialType)
- `{entity}.delete.dto.ts` - DTO para deleção
- `{entity}.list.dto.ts` - DTO para listagem

### Service

- `{entities}.service.ts` - Serviço com métodos CRUD básicos

### Controller

- `{entities}.controller.ts` - Controller REST com endpoints CRUD

### Module

- `{entities}.module.ts` - Módulo NestJS

## Boas Práticas

✅ **Faça:**

- Use `--dry-run` antes de gerar/regenerar para visualizar mudanças
- Use `--only-*` flags quando quiser atualizar apenas componentes específicos
- Teste com `--regenerate` em entidades existentes se fez mudanças na schema

❌ **Evite:**

- Regenerar tudo sem revisar, especialmente em produção
- Modificar DTOs manualmente sem usar o generator para atualizações futuras
- Perder track de quais componentes foram customizados

## Entidades Disponíveis

```
- accountsReceivables
- acquirers
- budgets
- cashAccounts
- cashMovements
- companies
- contasAPagar
- employees
- facilitadores
- financialGroups
- financialSubgroups
- fuelings
- orders
- paymentTypes
- persons
- productPickups
- productStocks
- products
- purchases
- sales
- sectorMasters
- sectors
- stockTransfers
- users
- vasilhameLoans
- vehicles
```

## Troubleshooting

### Erro: "Entity 'xyz' not found in schemas!"

- Verifique o nome exato da entidade (tabela)
- Use `python scripts/generate_crud.py --help` para ver exemplos

### Erro: "Entity 'xyz' already exists"

- Use `--regenerate` flag para forçar regeneração
- `python scripts/generate_crud.py --entity xyz --regenerate`

### Erro: "Module already imported in app.module.ts"

- O módulo já foi registrado
- Isso é normal quando regenerando
- Não há problema em continuar

## Dúvidas Frequentes

**P: Posso regenerar sem perder customizações?**
R: Depende do que foi customizado:

- **DTOs**: Serão sobrescritos
- **Service**: Será sobrescrito se usar `--only-service`
- **Controller**: Será sobrescrito se usar `--only-controller`

**P: Como atualizar apenas as validações dos DTOs?**
R: Use `--only-dto --regenerate` para atualizar apenas os DTOs

**P: O que acontece com o app.module.ts?**
R: É atualizado automaticamente só quando o Module é gerado. Se usar `--only-dto`, não é modificado.
