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
Entrega 1; Entrega 3 (spec `dados-iniciais`, implementada e verificada) em
`feature/dados-iniciais`, empilhada sobre a Entrega 2. Nenhuma tem PR ainda.

Entrega 3 — histórico do verificador (registros em
`docs/specs/dados-iniciais/verificacoes/`):
- Rodada 1 (`077c7a3`): PRONTA, mas apontou que um `DIRECT_URL` local em
  qualquer ponto do comando liberava migration de produção → corrigido em
  `a3776db`.
- Rodada 2 (`a3776db`): NÃO PRONTA — `$env:` via Bash, atribuição dupla,
  subcomando entre aspas; e o verificador não rodou os checks porque foi
  acionado com cwd em `apps/api` → corrigido em `45d2738`.
- Rodada 3 (`45d2738`): NÃO PRONTA — expansão do shell (`de${X}ploy`) e
  `git rebase --exec` → segunda camada no `prisma.config.ts` em `90677dd`;
  usuário aceitou o limite (agente que apaga `CLAUDECODE` de propósito).
- Rodada 4 (`90677dd`): PRONTA, **sem registro**: corrida entre o
  `SubagentStop` e a escrita do transcript → hook corrigido em `e7a8c5a`
  (a mensagem de `3ff630f` diz "rounds 4 and 5 records", mas só o da 5 existe).
- Rodada 5 (`e7a8c5a`): PRONTA, registrada.
- Rodada 6 (`5ba78cd`): PRONTA, registrada. Verificou a correção da
  transação do seed (abaixo).

Produção (2026-11-10, executado pelo usuário):
- Limpeza das tabelas de outros sistemas, `db:deploy` (2 migrations) e
  `db:seed` no Empresta.AI Project.
- A 1ª execução do seed falhou sem gravar nada ("Unable to start a
  transaction in the given time"): os limites padrão do Prisma (2 s / 5 s)
  não bastam para o Supabase remoto. Corrigido em `5ba78cd` (30 s / 2 min,
  teste com latência simulada). A 2ª execução passou.
- **CA-9 conferido pelo agente, só leitura:** 1 tenant (`suporte_ti`);
  12 equipamentos com patrimônio, nome e categoria da lista; `TI-0004`,
  `TI-0007` e `TI-0010` em `MAINTENANCE`, os outros 9 em `AVAILABLE`;
  `image_path` = `<patrimônio>.jpg` e o CHECK `equipment_image_path_format`
  presente; 0 empréstimos no total; 1 conta do professor, e-mail
  confirmado, com senha, perfil "Marcelo Grilo", 1 vínculo `EMPLOYEE` em
  `suporte_ti`, 0 empréstimos; as 12 URLs públicas
  `.../object/public/equipamentos/TI-00NN.jpg` respondem 200 `image/jpeg`.
- Não conferido pelo agente: entrar com a senha de
  `PROFESSOR_INITIAL_PASSWORD` (o agente não digita senha de produção); fica
  para a spec `login` ou para o usuário.

Spec `login` (branch `feature/login`, a partir de `feature/dados-iniciais`):
implementada e verificada (PRONTA em `aed95d6`). Front com React Router
(`/`, `/entrar`, `/inicio` protegida), tela de login do LAYOUT §5.1 sem o
botão de Operações, tela inicial com a barra de navegação; API com
`AuthGuard` (jose, JWKS ES256 do projeto) e `GET /v1/me`. O mesmo commit
mexeu no escopo das outras duas specs (`apps/web/src`,
`apps/*/package.json`); as duas foram verificadas de novo e continuam
PRONTA. O hook de `Stop` bloqueia o encerramento enquanto o verificador
ainda roda em segundo plano (não sabe que há verificação em curso):
melhoria possível.

Spec `solicitar-emprestimo` (Entrega 4, branch `feature/solicitar-emprestimo`,
a partir de `feature/login`): implementada e verificada (PRONTA em
`952d44b`). Conflitos do briefing decididos pelo PRD: limite 3 (não 5),
14 dias corridos (não úteis); item 9 (catálogo sem crédito) recusado.
Decisões do usuário: só Colaborador solicita (Operações vê o catálogo só
para consulta, sem a aba "Meus empréstimos"); item de outra pessoa aparece
só como "Emprestado"; modal de confirmação; busca e filtros incluídos.
API: `GET /v1/equipment`, `POST /v1/loans` (transação com `FOR UPDATE` no
vínculo; corrida no mesmo item barrada pelo índice único parcial; auditoria
`loan.created`), `GET /v1/loans/mine`. Sem migration. O teste de corrida do
limite foi conferido com a trava removida: falha nas 3 rodadas.

Verificador pegou uma brecha minha (rodada de `952d44b`, login NÃO PRONTA):
mudei as abas de Operações por uma linha na tabela de decisões, fora da
seção de CA, o que mantinha o hash dos CA e evitava nova verificação,
embora o CA-2 ainda dissesse "conforme LAYOUT §6". Corrigido escrevendo as
abas no próprio CA-2 (`d22d67d`), com a spec voltando a "aprovada" até a
nova rodada (PRONTA em `8f21ca5`). Material para o ENTREGA.md.

Falta (Entrega 4, CA-13, em produção, pelo usuário): depois do deploy, com
a conta de teste, conferir catálogo com fotos e crédito, `TI-0004/7/10`
sem solicitar, solicitar até a recusa por limite e "Meus empréstimos";
consulta somente leitura confirma zero empréstimos do professor. Limpar os
empréstimos de teste em produção, se quiser, é do usuário.

Falta (login, CA-10, em produção, pelo usuário):
- Vercel `empresta-ai-api`: `DATABASE_URL`, `DIRECT_URL` (o build roda
  `prisma generate`, que carrega `prisma.config.ts`), `SUPABASE_URL`,
  `SUPABASE_JWKS_URL`, `CORS_ORIGIN=https://empresta-ai-front.vercel.app`.
- Vercel `empresta-ai-front`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_API_URL=https://empresta-ai-api.vercel.app/v1`.
- Corrigir `apps/web/.env` local (ainda aponta para o projeto antigo).
- Conta de teste própria (não usar a do professor nos testes): criar no
  Supabase Auth com e-mail confirmado, mais perfil e vínculo `EMPLOYEE` em
  `suporte_ti`.
- Levar as branches empilhadas à `main` (push/PR, com autorização) para o
  deploy; conferir o CA-10 no link da Vercel.
- Lacunas de teste apontadas pelo verificador, sem reprovar: o teste de
  campos vazios do CA-3 é fraco (não há caso só com e-mail vazio);
  `authSettingsFromEnv` (emissor e JWKS a partir de `SUPABASE_URL`) só é
  exercitada em produção; falha de rede no "Sair" passa calada.

Falta (Entregas 1 e 2):
- Upload feito pelo usuário (2026-11-09) para o bucket público
  `equipamentos` do Empresta.AI Project. Conferido pelo agente: as 12 URLs
  `https://bnxelaknojdqswytnmuc.supabase.co/storage/v1/object/public/equipamentos/TI-00NN.jpg`
  respondem 200 sem login, `image/jpeg`, 800×600, com o mesmo SHA-256 de
  `creditos.json`. `out/` não vai para o git: em outra máquina, rodar
  `images:prepare` recria os arquivos a partir dos créditos e do cache.
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
