# Tasks: Login

Baseado em: [plan.md](./plan.md)

Cada item deve ser pequeno o suficiente para revisar sozinho e verificável
(dá para dizer com certeza se está feito ou não). Marque conforme conclui.

## Dados / backend

- [x] Build da API gera e compila o client do Prisma (`prisma generate` antes do `tsc`)
- [x] `PrismaService` com `DATABASE_URL` e filtro Problem Details global
- [x] `AuthModule` + `AuthGuard` (jose, JWKS, issuer, audience, ES256) e decorator do usuário atual
- [x] `GET /v1/me` (controller, service, repository) com 403 para 0 ou >1 vínculos
- [x] CORS com allowlist de `CORS_ORIGIN` em `configureApp`
- [x] Testes da API: CA-6, CA-7, CA-8, CA-9

## Frontend

- [x] Dependências (react-router, TanStack Query, React Hook Form, Zod) e `vercel.json` com rewrite da SPA
- [x] `AuthClient` (supabase-js) com contexto injetável e `fetchMe`
- [x] Rotas `/`, `/entrar`, `/inicio` com proteção por sessão; botão "Entrar" da landing vira link
- [x] Tela de login (LAYOUT §5.1, sem botão de Operações), validação e mensagens
- [x] Tela inicial com `Navbar` (abas do papel, etiqueta, avatar, nome, Sair)
- [x] Testes do front: CA-1, CA-2, CA-3, CA-4, CA-5, CA-7 (interface)

## Verificação

- [x] Testes automatizados cobrindo os critérios de aceite da spec
- [x] `lint`, `test` e `build` passando (ver [checks.md](../../../rules/checks.md))
- [x] Critérios de aceite do [spec.md](./spec.md) revalidados manualmente
