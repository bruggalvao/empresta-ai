# AGENTS.md

Instruções para agentes trabalhando neste repositório. Contexto de produto e
decisões técnicas completas estão em [docs/PRD.md](docs/PRD.md) e
[docs/adr/001-stack.md](docs/adr/001-stack.md) — leia-os antes de começar.
Este arquivo cobre apenas o que não está lá: fluxo de trabalho e convenções.

Veja também [rules/restrictions.md](rules/restrictions.md) para os limites de ação do
agente e [checks.md](checks.md) para o procedimento de verificação antes de
declarar uma tarefa pronta — leitura obrigatória, mesmo peso que este
arquivo.

## Estado atual do repositório

Este é um repositório greenfield: ainda não existe código, apenas docs e
`.env.example`. O projeto Supabase referenciado no `.env` **ainda não existe**
— ele precisa ser criado como parte do trabalho.

A primeira tarefa, antes de qualquer feature de negócio, é o scaffold
completo do monorepo conforme a ADR 001: pnpm workspaces, Turborepo,
`apps/web`, `apps/api` e os pacotes iniciais em `packages/*`
(`eslint-config`, `tsconfig`, `api-contract`).

## Autonomia e confirmação

Sempre peça confirmação antes de executar ações que criem ou alterem estado
externo compartilhado, incluindo:
- Criar ou configurar o projeto Supabase (banco, Auth, chaves).
- Rodar migrations contra um banco real (`prisma migrate deploy`/`dev` fora
  de um banco local efêmero).
- Criar ou configurar projetos na Vercel.
- Qualquer deploy.

Trabalho local reversível (código, configuração de workspace, testes) não
precisa de confirmação prévia.

## Fluxo de git

- Nunca commitar direto na `main`. Toda tarefa é feita em uma branch nova,
  seguida de PR para revisão.
- Commits e nomes de branch seguem **Conventional Commits**
  (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, etc.), com branches como
  `feature/<nome-curto>` ou `fix/<nome-curto>`.

## Idioma

- Código: identificadores, comentários e mensagens de commit em **inglês**.
- Tudo o mais — UI, documentação de negócio (PRD, ADRs), textos voltados ao
  usuário final — em **PT-BR**, consistente com os docs já existentes.

## Antes de considerar uma tarefa concluída

Sempre que os workspaces já tiverem os scripts correspondentes, rode
`lint`, `test` e `build` (via Turborepo, ex.: `pnpm turbo run lint test
build --filter=...[origin/main]`) antes de dar a tarefa por concluída. Não
pule essa etapa mesmo que ainda não exista CI configurado.
