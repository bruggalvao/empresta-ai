# Handoff

Documento vivo de passagem de contexto entre sessões/agentes. **Sempre
sobrescrito** — reflete o estado mais recente, não um histórico. Antes de
começar qualquer tarefa, leia este arquivo inteiro. Ao final de uma
sessão de trabalho relevante, atualize-o.

Última atualização: 2026-10-19

## Estado geral

Repositório greenfield em scaffold inicial. Ainda não há feature de
negócio implementada — o foco até aqui foi infraestrutura de projeto
(monorepo, conexão Supabase, padrão de specs), mais a landing page e o
endpoint de health.

## O que já existe

- `apps/web`: Vite + React + TypeScript + Tailwind v4. A home é a landing
  page ([Landing.tsx](../apps/web/src/pages/Landing.tsx)), estática (sem
  dependência do Supabase), com os tokens da ADR 002 em
  [index.css](../apps/web/src/index.css) via `@theme` e componentes base em
  `src/components/` (`Brand`, `StatusPill`, `SectionRule`). O botão "Entrar"
  está desabilitado até existir login. O check de conexão com o Supabase que
  ficava em `App.tsx` foi removido; `src/lib/supabaseClient.ts` continua
  no repo, sem uso por enquanto.
- `apps/api`: NestJS (ESM, Nest 12) com `GET /v1/health` (liveness, sem
  banco), teste com Jest + supertest. Scripts: `dev`, `build`, `start`,
  `test`. Prefixo e porta vêm de `API_PREFIX` e `PORT` (já no
  `.env.example`). O scaffold do Prisma (`prisma/`) segue ao lado.
- `docs/specs/`: estrutura de spec-driven development (spec.md + plan.md
  + tasks.md por feature). Ver [docs/specs/README.md](specs/README.md).
- Docs de produto e design: [PRD.md](PRD.md), [LAYOUT.md](LAYOUT.md),
  [adr/001-stack.md](adr/001-stack.md) e
  [adr/002-design-system.md](adr/002-design-system.md) (Proposto).
- Modelagem de dados: [modelagem-dados.md](modelagem-dados.md) (diagrama
  Mermaid) e `apps/api/prisma/` (schema, migration inicial, seed). Validada
  só em Postgres local descartável; ainda não aplicada ao Supabase real.
  O módulo Nest ainda não usa o Prisma.
- Regras para agentes em `rules/`: `restrictions.md`, `checks.md`,
  `secrets.md`.
- Turborepo na raiz (`turbo.json`, scripts `build`/`lint`/`test`/`dev`).
  Workspaces: `apps/web` (tem `lint` e `build`, ainda sem `test`) e
  `apps/api` (tem `build` e `test`, ainda sem `lint`).
- Skills de agente versionadas em `.agents/skills/` e
  `.claude/skills/`, com `skills-lock.json`.
- Subagent `verificador-spec` em `.claude/agents/verificador-spec.md`
  (verifica os critérios de aceite de uma spec antes de dá-la por pronta).

- Vercel (time BGGTeam, projetos ligados ao GitHub, deploy automático a
  cada push na `main`): `empresta-ai-front` (Root Directory `apps/web`,
  https://empresta-ai-front.vercel.app) e `empresta-ai-api` (Root Directory
  `apps/api`, https://empresta-ai-api.vercel.app/v1/health). A API roda como
  função serverless em `apps/api/api/index.js` (reaproveita a instância
  Express do Nest compilada em `dist/`; `vercel.json` define rewrite e
  `outputDirectory: public`). Nenhuma variável de ambiente foi cadastrada
  ainda (nenhuma é necessária hoje); o `turbo-ignore` da ADR 001 não foi
  configurado.

## O que ainda não existe

- Os pacotes `packages/eslint-config`, `packages/tsconfig`,
  `packages/api-contract` do scaffold previsto na ADR 001.
- Adapter serverless da API para a Vercel (`@vendia/serverless-express`),
  OpenAPI, helmet, CORS, validação de env com Zod, guards de auth.
- Remoto git: `origin` = https://github.com/bruggalvao/empresta-ai.git, com
  `main` publicada. O filtro `--filter=...[origin/main]` dos checks já
  funciona. As demais branches seguem só locais.
- Projeto Supabase real (banco, Auth, chaves) — o `.env` local referencia um
  projeto que ainda precisa ser criado. Requer confirmação do usuário
  antes de criar (ver [rules/restrictions.md](../rules/restrictions.md)).
- Qualquer spec de feature em `docs/specs/` além do template.
- Telas do produto (login, catálogo, empréstimos, Operações). Só existe a
  landing page.

## Em andamento / próximo passo sugerido

Landing page e `GET /v1/health` implementados na branch
`feature/landing-and-health` e integrados à `main` local (sem PR, pois não
há remoto). Próximo passo natural: criar o remoto e dar push, completar o scaffold do monorepo
(`packages/*`) conforme a ADR 001, ou escrever a primeira spec de feature
(candidata natural: catálogo de equipamentos, por ser a base das outras
features do PRD).

## Decisões pendentes / dúvidas em aberto

- Fluxo de convite de usuários (cadastro fechado, ADR 001): sem spec nem
  tabela; precisa de spec antes de implementar.
- Aceitar a [ADR 002](adr/002-design-system.md) (status Proposto).
- Tailwind v4 usa `@theme` no CSS em vez de `theme.extend`; a ADR 002 (2.1)
  ainda cita a sintaxe do v3. Os valores de `--shadow-sm/md/lg` não estão
  na ADR e foram definidos em `index.css`.
- ESM no `apps/api` obriga imports com extensão `.js` e o Jest roda com
  `--experimental-vm-modules`. Alternativa é migrar a API para CommonJS, mas
  isso afeta o formato do client gerado pelo Prisma 7.
- Contraste WCAG dos textos de baixa opacidade e layout mobile, listados
  como riscos na ADR 002.

## Como retomar

- `pnpm` não está no PATH desta máquina e o `corepack` falha na verificação
  de assinatura. Use `npx -y pnpm@12.5.1 <comando>` (versão de
  `packageManager`).
- `pnpm-workspace.yaml`: `@swc/core`, `@parcel/watcher` e `unrs-resolver`
  estão com `allowBuilds: false` (scripts de build bloqueados; o SWC
  funciona sem eles).
- Branch atual de trabalho: verificar com `git branch --show-current`.
- Antes de considerar qualquer tarefa concluída, rodar `lint`, `test` e
  `build` conforme [rules/checks.md](../rules/checks.md).
- Ações que criam/alteram estado externo compartilhado (projeto Supabase,
  migrations em banco real, projetos Vercel, deploys) exigem confirmação
  explícita do usuário — ver [AGENTS.md](../AGENTS.md).
