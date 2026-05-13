# Entities

## Propósito

Definir modelos/entidades tipadas do domínio do frontend.

## O que faz

- Representa os contratos de dados esperados pelo frontend.
- Facilita tipagem em chamadas de API e componentes.
- Normaliza nomes de campos e ajuda a manter consistência com o backend.

## Diretrizes

- Não adicionar lógica de UI aqui.
- Atualizar os tipos quando a API do backend mudar.
- Use `src/entities/index.ts` para exportar todos os modelos de forma centralizada.
- Mantenha os nomes alinhados com os recursos do backend (`User`, `Sale`, `Product`, etc.).
