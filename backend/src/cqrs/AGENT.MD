# CQRS

## Propósito

Implementar funcionalidades que fogem do CRUD genérico, especialmente consultas, relatórios e handlers de leitura especializados.

## O que faz

- `CqrsModule`: importa o `@nestjs/cqrs` para suporte a handlers e queries.
- `controllers/`: endpoints específicos de relatório ou operações customizadas.
- `handlers/`: lógica de comando/query personalizada.
- `queries/`: classes de query para separar intent de execução.

## Diretrizes

- Coloque aqui apenas fluxos que não se encaixam no padrão `resources/*`.
- Preserve a separação entre consulta especializada e o CRUD genérico.
- Use `CQRS` para relatórios, agregações ou queries complexas.
- Mantenha `resources` para endpoints REST padrão e `cqrs` para casos especiais.
