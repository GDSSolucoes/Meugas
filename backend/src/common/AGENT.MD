# Common

## Propósito

Conteúdo compartilhado entre os recursos backend: classes base, DTOs genéricos e helpers que suportam o CRUD padrão.

## O que faz

- `BaseCrudService`: camada genérica de CRUD integrada a RLS e ao contexto de request.
- `BaseCrudController`: controller genérico para operações REST básicas.
- `dto/`: DTOs e classes base usadas por múltiplos recursos.
- `BASE_CRUD_README.md`: explicação da arquitetura de CRUD e do fluxo de RLS.

## Diretrizes

- Deve conter apenas utilitários reutilizáveis e abstrações de infraestrutura.
- Não implementar lógica de domínio específica aqui.
- Novos recursos devem herdar de `BaseCrudService` / `BaseCrudController` sempre que possível.
- Atualize este módulo antes de alterar vários recursos de CRUD, pois ele dita o padrão.

## Como usar

- Para criar um novo recurso, estenda os bases e mantenha os DTOs do domínio no diretório de `resources`.
- Use `common/dto` para definições de request/resposta compartilhadas.
