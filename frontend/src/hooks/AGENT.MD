# Hooks

## Propósito

Armazenar hooks customizados para comportamento reutilizável no frontend.

## O que faz

- Inclui hooks como `useMobile`.
- Encapsula lógica de UI dependente de ambiente ou comportamento.
- Pode conter listeners, detecção de viewport e outros utilitários de estado.

## Diretrizes

- Hooks devem ser reutilizáveis e isolados.
- Não renderizar JSX diretamente dentro de hooks.
- Evite dependências de componentes específicos.
- Use hooks para abstrair lógica de interação e estado local.
