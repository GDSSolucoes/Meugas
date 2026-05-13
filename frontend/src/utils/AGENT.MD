# Utils

## Propósito

Fornecer funções utilitárias puras e helpers leves.

## O que faz

- `createPageUrl`: transforma nomes de página em URLs.
- `cn`: combina classes CSS com `clsx` e `tailwind-merge`.
- Outras funções pequenas e genéricas usadas por múltiplas camadas.

## Diretrizes

- Deve ser puro e sem efeitos colaterais.
- Não deve depender de componentes ou contexto de aplicação.
- Use `utils` para helpers que não pertencem a uma única página ou componente.
