# Tasks: Login

Baseado em: [plan.md](./plan.md)

Cada item deve ser pequeno o suficiente para revisar sozinho e verificável
(dá para dizer com certeza se está feito ou não). Marque conforme conclui.

## Dados / backend

- [ ] Build da API gera e compila o client do Prisma (`prisma generate` antes do `tsc`, sem exigir `DIRECT_URL`)
- [ ] `PrismaService` com `DATABASE_URL` e filtro Problem Details global
- [ ] `AuthModule` + `AuthGuard` (jose, JWKS, issuer, audience, ES256) e decorator do usuário atual
- [ ] `GET /v1/me` (controller, service, repository) com 403 para 0 ou >1 vínculos
- [ ] CORS com allowlist de `CORS_ORIGIN` em `configureApp`
- [ ] Testes da API: CA-6, CA-7, CA-8, CA-9

## Frontend

- [ ] Dependências (react-router, TanStack Query, React Hook Form, Zod) e `vercel.json` com rewrite da SPA
- [ ] `AuthClient` (supabase-js) com contexto injetável e `fetchMe`
- [ ] Rotas `/`, `/entrar`, `/inicio` com proteção por sessão; botão "Entrar" da landing vira link
- [ ] Tela de login (LAYOUT §5.1, sem botão de Operações), validação e mensagens
- [ ] Tela inicial com `Navbar` (abas do papel, etiqueta, avatar, nome, Sair)
- [ ] Testes do front: CA-1, CA-2, CA-3, CA-4, CA-5, CA-7 (interface)

## Verificação

- [ ] Testes automatizados cobrindo os critérios de aceite da spec
- [ ] `lint`, `test` e `build` passando (ver [checks.md](../../../rules/checks.md))
- [ ] Critérios de aceite do [spec.md](./spec.md) revalidados manualmente
