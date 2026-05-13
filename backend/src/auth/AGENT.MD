# Auth

## Propósito

Esta pasta contém autenticação e autorização do backend.

## O que faz

- `AuthController`: endpoints de login / logout.
- `AuthService`: valida credenciais e emite JWT.
- `JwtStrategy`: validações de token JWT.
- `JwtAuthGuard`: protege rotas usando JWT.
- `RolesGuard` / `RolesDecorator`: controle de acesso por perfil.
- `UsersModule`: fonte de dados dos usuários para autenticação.

## Diretrizes

- Alterações de autenticação devem permanecer aqui.
- Não colocar regras de negócio de domínio neste módulo.
- Mantenha o token JWT seguro por `process.env.JWT_SECRET`.
- Expiração e validação de claims devem ser consistentes com os guards.
- Use `RolesGuard` em recursos que exigem permissão adicional.

## Quando criar algo novo aqui

- Apenas se for uma nova estratégia de autenticação/autorização.
- Para novos endpoints de usuário ou login social, continue neste escopo.
