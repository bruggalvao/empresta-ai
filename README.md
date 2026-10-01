# empresta-ai

Controle interno de empréstimo de equipamentos de TI (notebooks, monitores,
cabos, câmeras), em substituição à planilha manual. Contexto de produto em
[docs/PRD.md](docs/PRD.md).

## Estrutura

Monorepo com pnpm workspaces e Turborepo (ver [ADR 001](docs/adr/001-stack.md)).

```
apps/web      SPA (Vite + React + TypeScript)
apps/api      API NestJS — ainda não criada
packages/*    pacotes compartilhados — ainda não criados
docs/         PRD, layout, ADRs, specs e handoff
rules/        regras para agentes (restrições, verificação, segredos)
```

## Desenvolvimento

Requer Node.js LTS e pnpm (versão fixada em `packageManager`).

```bash
pnpm install
cp .env.example apps/web/.env   # preencha com os dados do projeto Supabase
pnpm dev
```

Verificação antes de abrir PR:

```bash
pnpm turbo run lint test build --filter=...[origin/main]
```

## Documentação

- [docs/handoff.md](docs/handoff.md) — estado atual e próximos passos
- [docs/PRD.md](docs/PRD.md) — produto
- [docs/LAYOUT.md](docs/LAYOUT.md) — especificação das telas
- [docs/adr/](docs/adr/) — decisões de arquitetura (stack, design system)
- [docs/specs/](docs/specs/README.md) — specs por feature
- [AGENTS.md](AGENTS.md) — convenções de trabalho e fluxo de git
