# Providers

## Propósito

Encapsular integrações específicas de serviço.

## O que faz

- `FiscalProvider.ts`: lidar com chamadas fiscais como emissão e cancelamento de notas.
- Serve como camada de serviço para integrações externas do backend.

## Diretrizes

- Mantenha a lógica de integração e chamadas de API aqui.
- Não renderize UI nem manipule roteamento.
- Use este diretório para serviços que representam um contrato funcional claro.
