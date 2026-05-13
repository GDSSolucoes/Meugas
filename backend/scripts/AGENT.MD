# Scripts

## Propósito

Arquivos de automação e geração de código para o backend. Não fazem parte do runtime da API.

## O que contém

- `generate_crud.py`: gerador de CRUDs para NestJS + Drizzle ORM.

## Quando usar

- Usar apenas para criar novos módulos de recurso a partir das definições em `src/database/schemas`.
- O script gera DTOs, service, controller, module e registra o módulo em `src/app.module.ts`.

## Regras

- Não implementar lógica de negócio aqui.
- Manter o script atualizado com as convenções de `common/base-crud`.
- Quando houver alteração de template de CRUD, atualize o gerador e verifique o resultado com `--dry-run`.
- Esta pasta não é para código da API em produção; é para facilitar criação de código repetitivo.
