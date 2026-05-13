# Pages

## Propósito

Conter as telas/rotas da aplicação.

## O que faz

- Cada arquivo em `src/pages/` representa uma página ou rota.
- Páginas orquestram componentes, hooks e chamadas de API.
- Devem montar a experiência visual e de fluxo do usuário.

## Diretrizes

- Use componentes de `src/components` para UI e `src/hooks`/`src/api` para dados.
- Não coloque lógica de infraestrutura global aqui.
- As páginas devem ser consideradas entrypoints para cada rota.
- Evite duplicar lógica entre páginas; extraia para hooks ou componentes.
