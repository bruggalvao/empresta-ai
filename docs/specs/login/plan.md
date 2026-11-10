# Plan: Login

Baseado em: [spec.md](./spec.md)

Escopo de código: `apps/api/src` · `apps/api/api` · `apps/api/package.json` · `apps/api/tsconfig.json` · `apps/api/tsconfig.build.json` · `apps/api/jest.config.js` · `apps/api/vercel.json` · `apps/api/prisma/schema.prisma` · `apps/api/prisma/migrations` · `apps/web/src` · `apps/web/index.html` · `apps/web/package.json` · `apps/web/vite.config.ts` · `apps/web/vitest.config.ts` · `apps/web/vercel.json`

O escopo inclui a entrada serverless da API e o `vercel.json` do front
(rewrite da SPA), porque um erro neles quebra o CA-10 sem quebrar teste.

## Resumo técnico

O front entra pelo `supabase-js` (e-mail e senha) e guarda a sessão no
navegador. Cada chamada à API leva o access token como Bearer. Na API, um
guard valida o token com `jose` contra o JWKS do projeto (ES256), confere
emissor e audiência, e `GET /v1/me` acha perfil e vínculo pelo `sub` com
Prisma. O front usa React Router (`/`, `/entrar`, `/inicio` protegida) e
TanStack Query para `/v1/me`.

## Modelo de dados

Nenhuma mudança. Lê `profiles`, `memberships` e `tenants` (RLS `deny_all`
continua; a API conecta como dono das tabelas, ADR 001 §3).

## Contrato de API

`GET /v1/me` — cabeçalho `Authorization: Bearer <access token do Supabase>`.

```json
200 {
  "userId": "uuid", "email": "pessoa@dominio", "fullName": "Marcelo Grilo",
  "role": "EMPLOYEE" | "OPERATIONS",
  "tenant": { "slug": "suporte_ti", "name": "Suporte de TI" }
}
```

Erros em Problem Details (RFC 9457, `application/problem+json`, campos
`type`, `title`, `status`, `detail`):

| status | quando |
|---|---|
| 401 | sem token, malformado, expirado, assinatura que não confere com o JWKS, `iss` ≠ `${SUPABASE_URL}/auth/v1`, `aud` ≠ `authenticated` |
| 403 | token válido, mas a conta não tem vínculo ou tem mais de um |

`packages/api-contract` (OpenAPI + orval) ainda não existe no repositório
(handoff). O tipo da resposta fica num arquivo do front
(`apps/web/src/lib/api/me.ts`) até o pacote existir; criá-lo é uma tarefa
de scaffold à parte, não desta spec.

## Backend (`apps/api/src`)

```
app.setup.ts            — prefixo /v1, CORS (allowlist de CORS_ORIGIN, separada por vírgula), filtro Problem Details
common/problem.filter.ts— HttpException → application/problem+json
prisma/prisma.service.ts— PrismaClient + PrismaPg(DATABASE_URL), conexão preguiçosa
auth/auth.module.ts     — provê AUTH_CONFIG { issuer, audience } e JWKS (createRemoteJWKSet(SUPABASE_JWKS_URL))
auth/auth.guard.ts      — Bearer → jwtVerify(jwks, { issuer, audience, algorithms: ["ES256"] }) → req.auth = { userId: sub }
auth/current-user.ts    — decorator que lê req.auth (nunca query, corpo ou cabeçalho próprio)
me/me.controller.ts     — GET /me com AuthGuard
me/me.service.ts        — 0 ou >1 vínculos → 403; 1 → resposta
me/membership.repository.ts — Prisma: vínculos do userId com perfil e tenant
```

- `SUPABASE_JWKS_URL` cai para `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`
  se não estiver definida. `SUPABASE_JWT_SECRET` não é usada (o projeto
  assina com ES256, conferido no JWKS público em 2026-11-10).
- Prisma no build: hoje `tsconfig` exclui `src/generated` e o client só é
  gerado localmente (fora do git). O build passa a rodar `prisma generate`
  antes do `tsc` e a compilar o client gerado para `dist/`; a Vercel faz o
  mesmo. `prisma.config.ts` não pode exigir `DIRECT_URL` só para gerar.
- Variáveis já existentes no `.env.example`; nenhuma nova.

## Frontend (`apps/web/src`)

```
main.tsx                — QueryClientProvider + RouterProvider
router.tsx              — / (Landing) · /entrar (Login) · /inicio (RequireSession → Home)
lib/auth/               — AuthClient (interface: signIn, signOut, getSession, onChange) + implementação supabase-js; contexto para testes injetarem um falso
lib/api/me.ts           — fetchMe(token) → Me | MeError(401|403); tipo Me
pages/Login.tsx         — LAYOUT §5.1 sem o botão de Operações; React Hook Form + Zod
pages/Home.tsx          — Navbar + "Olá, {primeiro nome}" + texto curto
components/Navbar.tsx   — LAYOUT §6: marca, abas do papel (desabilitadas, "Em breve"), etiqueta, avatar, nome, Sair
components/Button.tsx, Field.tsx — variantes do ADR 002 §2.5 (primary/ghost/block, label + input)
```

- Abas por papel (LAYOUT §6): Colaborador → Catálogo, Meus empréstimos;
  Operações → Catálogo, Operações, Equipamentos, Meus empréstimos.
- Iniciais: primeira letra do primeiro e do último nome.
- `/inicio`: sem sessão → `/entrar`; `/v1/me` 403 → mensagem da spec no
  login + `signOut`; 401 → `signOut` e `/entrar`.
- Landing: o botão "Entrar" vira link para `/entrar`.
- `apps/web/vercel.json`: rewrite de tudo para `/index.html`, para
  `/entrar` e `/inicio` abrirem direto e ao recarregar.
- Novas dependências (ADR 001 §2.2): `react-router`, `@tanstack/react-query`,
  `react-hook-form`, `zod`, `@hookform/resolvers`. Na API: `jose`. Versões
  com pelo menos o `minimumReleaseAge` do pnpm.

## Testes

- API (Jest + supertest + Testcontainers, Postgres real com as
  migrations): par de chaves ES256 gerado no teste e servido como JWKS
  local (o provider de JWKS é trocado no módulo de teste), tokens
  assinados no teste. Dois tenants para o CA-8. CORS (CA-9) com supertest
  e cabeçalho `Origin`.
- Web (Vitest + Testing Library): `AuthClient` falso e `fetchMe` falso;
  rotas com `createMemoryRouter`. Um teste por CA (1–5, parte de UI do 7).

## Decisões técnicas e alternativas consideradas

| decisão | alternativa | por quê |
|---|---|---|
| `jose` para validar o JWT | `passport-jwt` + `jwks-rsa` | `jose` valida ES256 com JWKS remoto e cache em uma dependência, sem Passport |
| Componentes próprios (`Button`, `Field`) sobre os tokens | shadcn/ui (ADR 001 §2.2, ADR 002 §2.5) | shadcn ainda não está instalado no repositório; os componentes base existentes (`Brand`, `StatusPill`) já são próprios. Instalar shadcn é trabalho de scaffold à parte |
| Tipo `Me` no front, sem orval | cliente gerado de `packages/api-contract` | o pacote ainda não existe; um endpoint não justifica criar o pipeline nesta spec |
| Sem `AsyncLocalStorage` | contexto de request da ADR 001 §2.3 | `/v1/me` só precisa do `userId` do guard; o contexto entra quando houver serviço que o use |

## Riscos e dependências

- Depende da conta do professor (spec dados-iniciais, em produção) e do
  projeto Supabase `bnxelaknojdqswytnmuc`.
- Produção depende de passos do usuário (o agente não faz): variáveis na
  Vercel (`empresta-ai-api`: `DATABASE_URL`, `SUPABASE_URL`,
  `SUPABASE_JWKS_URL`, `CORS_ORIGIN`; `empresta-ai-front`:
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`), corrigir
  `apps/web/.env` local (ainda aponta para o projeto antigo), criar a conta
  de teste própria (Auth + perfil + vínculo) e levar a branch à `main`
  (push/PR com autorização), que dispara o deploy.
- Vercel (EUA) × banco em São Paulo: `/v1/me` paga a latência (ADR 001 §4).
- Gerar o client do Prisma no build da Vercel é a parte mais incerta; se
  falhar, só se descobre no deploy.
