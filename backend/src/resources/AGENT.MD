# Resources

## Propósito

Implementar os módulos de domínio que expõem os endpoints CRUD padrões do backend.

## O que faz

- Cada subpasta corresponde a um domínio (`companies`, `users`, `products`, etc.).
- Cada domínio contém `*.controller.ts`, `*.service.ts`, `*.module.ts` e `dto/`.
- Usa `common/BaseCrudController` e `common/BaseCrudService` para padrão CRUD.

## Diretrizes

- Mantenha as rotas RESTful e os nomes de recursos no plural.
- Use o padrão genérico existente sempre que possível.
- Personalize apenas quando houver regras de negócio específicas.
- Para novos recursos, siga o fluxo:
  1. definir schema em `src/database/schemas`
  2. criar DTOs em `dto/`
  3. criar service/controller/module
  4. registrar no `AppModule`
- Não adicione relatórios ou queries especializadas aqui; use `src/cqrs` para esses casos.
