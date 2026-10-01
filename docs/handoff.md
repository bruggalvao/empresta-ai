# Handoff

Documento vivo de passagem de contexto entre sessões/agentes. **Sempre
sobrescrito** — reflete o estado mais recente, não um histórico. Antes de
começar qualquer tarefa, leia este arquivo inteiro. Ao final de uma
sessão de trabalho relevante, atualize-o.

Última atualização: 2026-10-01

## Estado geral

Repositório greenfield em scaffold inicial. Ainda não há feature de
negócio implementada — o foco até aqui foi infraestrutura de projeto
(monorepo, conexão Supabase, padrão de specs).

## O que já existe

- `apps/web`: scaffold Vite + React + TypeScript, com verificação de
  conexão ao Supabase na tela inicial (placeholder técnico, não é a home
  do produto). Ver [App.tsx](../apps/web/src/App.tsx).
- `docs/specs/`: estrutura de spec-driven development (spec.md + plan.md
  + tasks.md por feature). Ver [docs/specs/README.md](specs/README.md).
- Docs de produto e design: [PRD.md](PRD.md), [LAYOUT.md](LAYOUT.md),
  [adr/001-stack.md](adr/001-stack.md) e
  [adr/002-design-system.md](adr/002-design-system.md) (Proposto).
- Modelagem de dados: [modelagem-dados.md](modelagem-dados.md) (diagrama
  Mermaid) e `apps/api/prisma/` (schema, migration inicial, seed). Validada
  só em Postgres local descartável; ainda não aplicada ao Supabase real.
- Regras para agentes em `rules/`: `restrictions.md`, `checks.md`,
  `secrets.md`.
- Turborepo na raiz (`turbo.json`, scripts `build`/`lint`/`test`/`dev`).
  Só `apps/web` existe como workspace; `web` ainda não tem script `test`.
- Skills de agente versionadas em `.agents/skills/` e
  `.claude/skills/`, com `skills-lock.json`.

## O que ainda não existe

- `apps/api` e os pacotes `packages/eslint-config`, `packages/tsconfig`,
  `packages/api-contract` do scaffold previsto na ADR 001.
- Projeto Supabase real (banco, Auth, chaves) — o `.env` local referencia um
  projeto que ainda precisa ser criado. Requer confirmação do usuário
  antes de criar (ver [rules/restrictions.md](../rules/restrictions.md)).
- Qualquer spec de feature em `docs/specs/` além do template.
- Tela inicial real do produto (catálogo, empréstimos, tela de
  Operações) — o que existe hoje em `App.tsx` é só o check de conexão.

## Em andamento / próximo passo sugerido

Nenhuma tarefa em andamento no momento. Próximo passo natural: completar
o scaffold do monorepo (`apps/api`, `packages/*`) conforme a ADR 001, ou
escrever a primeira spec de feature (candidata natural: catálogo de
equipamentos, por ser a base das outras features do PRD).

## Decisões pendentes / dúvidas em aberto

- Fluxo de convite de usuários (cadastro fechado, ADR 001): sem spec nem
  tabela; precisa de spec antes de implementar.
- Linha de revisão na ADR 001 sobre `directUrl` no Prisma 7.
- Aceitar a [ADR 002](adr/002-design-system.md) (status Proposto).
- Contraste WCAG dos textos de baixa opacidade e layout mobile, listados
  como riscos na ADR 002.

## Como retomar

- Branch atual de trabalho: verificar com `git branch --show-current`.
- Antes de considerar qualquer tarefa concluída, rodar `lint`, `test` e
  `build` conforme [rules/checks.md](../rules/checks.md).
- Ações que criam/alteram estado externo compartilhado (projeto Supabase,
  migrations em banco real, projetos Vercel, deploys) exigem confirmação
  explícita do usuário — ver [AGENTS.md](../AGENTS.md).
