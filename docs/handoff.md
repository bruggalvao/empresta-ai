# Handoff

Documento vivo de passagem de contexto entre sessões/agentes. **Sempre
sobrescrito** — reflete o estado mais recente, não um histórico. Antes de
começar qualquer tarefa, leia este arquivo inteiro. Ao final de uma
sessão de trabalho relevante, atualize-o.

Última atualização: 2026-11-09

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
  (verifica os critérios de aceite de uma spec antes de dá-la por pronta),
  tornado obrigatório por hooks (ver seção "Verificação de specs" do
  [AGENTS.md](../AGENTS.md)): gatilho no `Stop` do agente principal, trava
  de `Status: implementada`, registros em `docs/specs/<feature>/verificacoes/`
  gravados pelo `SubagentStop`, Bash do verificador restrito a lint/test/build
  e git somente leitura, e checagem no CI
  (`.github/workflows/spec-verification.yml`). Lógica comum em
  `scripts/spec-verification.mjs`. Template de spec agora exige IDs `CA-n`.
  Todos os hooks ficam em `.claude/settings.json`: hooks no frontmatter do
  subagente não rodaram na primeira rodada real (corrigido em `4071865`).
  Validade do registro é por escopo: o `plan.md` declara `Escopo de código:`
  e só mudança ali invalida a verificação (antes, qualquer código do repo
  invalidava — o ajuste do filtro de fotos derrubou o registro da biblioteca).
  Pedido do tech lead de o verificador corrigir teste quebrado foi
  recusado (contraria a independência exigida) — registrar no ENTREGA.md.
- Skill `imagens-equipamentos` (`.claude/skills/`) sobre o workspace
  `packages/equipment-images`: Pixabay (cache 24h), filtro de tags,
  recorte 800×600 com jimp ([ADR 003](adr/003-processamento-de-imagens.md)),
  `creditos.json`/`rejeicoes.json` versionados, folha de revisão e upload
  para o bucket público `equipamentos`. O upload é só humano (hook
  `guard-image-upload.mjs` + recusa com `CLAUDECODE`). Precisa de
  `PIXABAY_API_KEY` em `apps/api/.env`.
- Biblioteca de renderização em `apps/web/src/lib/equipment-photo/`
  (spec `biblioteca-renderizacao`, implementada e verificada): toda foto de
  equipamento passa por `EquipmentPhotoArea` + `EquipmentPhoto`. O
  `apps/web` agora tem `test` (Vitest + Testing Library + jsdom 28).

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
- Supabase configurado no app. Decisão do usuário (2026-11-09): o projeto é
  **Empresta.AI Project** (`bnxelaknojdqswytnmuc`, organização "time do
  bgg", plano free, já com 2 projetos ativos). O endereço antigo
  `gkicttuoyjicaonzjoyp.supabase.co` não existe mais (DNS ENOTFOUND) e ainda
  está no `apps/web/.env`; o `apps/api/.env` passou a apontar para o projeto
  certo para o upload das fotos. Falta: corrigir `apps/web/.env`, cadastrar
  as variáveis na Vercel e aplicar migrations/seed (Entrega 3, com
  confirmação do usuário).
- Telas do produto (login, catálogo, empréstimos, Operações). Só existe a
  landing page.

## Em andamento / próximo passo sugerido

Landing page e `GET /v1/health` implementados na branch
`feature/landing-and-health` e integrados à `main` local (sem PR, pois não
há remoto). Próximo passo natural: criar o remoto e dar push, completar o scaffold do monorepo
(`packages/*`) conforme a ADR 001, ou escrever a primeira spec de feature
(candidata natural: catálogo de equipamentos, por ser a base das outras
features do PRD).

Prática SDD (`pratica-sdd-subagentes.html`, fora do git): Entrega 1
(verificador obrigatório) em `feature/verificador-obrigatorio`; Entrega 2
(skill + biblioteca) em `feature/imagens-equipamentos`, empilhada sobre a
Entrega 1. Nenhuma das duas tem PR ainda. Falta:
- O usuário rodar `images:upload` no terminal dele. As 12 fotos já foram
  preparadas (`creditos.json`); `out/` não vai para o git, então em outra
  máquina é preciso rodar `images:prepare` de novo (usa o cache/créditos).
- Revisão visual 1 (2026-11-09): o agente olhou as 12 fotos; o usuário
  reprovou 2 (TI-0001 fora do tema, TI-0005 tela com código — ver
  `rejeicoes.json`) e o filtro foi ajustado (marcas de câmera, retro/coffee,
  notebook exige tag `laptop`). O usuário **manteve** fotos em que o agente
  apontou problema de direito de imagem: TI-0004 (mãos/pernas de pessoa),
  TI-0007 (texto na tela e etiqueta de marca), TI-0012 (logo OLYMPUS) e as
  substitutas TI-0001 (ASUS/Nikon/Logitech) e TI-0005 (logo Apple). As tags
  do Pixabay quase nunca citam marca nem pessoa: o filtro por tag não cobre
  esse risco, só a revisão humana.
- Cadastrar `PIXABAY_API_KEY` nos dois projetos Vercel (decisão de seguir
  `rules/secrets.md` ao pé da letra).
- A prova com erro plantado da Entrega 1, sobre a spec `dados-iniciais`.
- Decidir na spec da Entrega 4 o conflito entre o briefing ("sem texto de
  crédito") e o CA-7 da biblioteca.

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
