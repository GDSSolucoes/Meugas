# Components

## Propósito

Reutilizar blocos de interface e componentes UI específicos de domínio.

## O que faz

- Agrupa componentes visuais reutilizáveis em `src/components/`
- Exemplos: cards, tabelas, botões, mensagens de erro e componentes específicos de acerto/financeiro
- Deve servir como camada de apresentação, não de estado global

## Diretrizes

- Mantenha componentes pequenos e focados em uma única responsabilidade.
- Preferir composição em vez de herança.
- Evite lógica de fetch ou roteamento dentro de componentes puros.
- Componentes que dependem de dados devem receber props e callbacks.
- Use o diretório para agrupar componentes por área quando fizer sentido.
