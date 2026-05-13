# Interceptors

## Propósito

Interceptar requisições HTTP para tratamento comum de erros e outras preocupações transversais.

## O que faz

- `http-error.interceptor.ts`: captura exceções, gera `request_id`, registra logs e retorna resposta padronizada.

## Diretrizes

- Deve ficar apenas lógica cross-cutting, como tratamento de erro, logs ou métricas.
- Não implemente lógica de negócio específica aqui.
- Mantenha os interceptors pequenos e fáceis de entender.

## Quando criar algo novo aqui

- Novo interceptor global para transformar ou registrar requisições.
- Não coloque validação de payload ou regras de autorização aqui; use pipes e guards.
