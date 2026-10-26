# AGENTS.md

Instruções para agentes trabalhando neste repositório. Contexto de produto e
decisões técnicas completas estão em [docs/PRD.md](docs/PRD.md) e
[docs/adr/001-stack.md](docs/adr/001-stack.md) — leia-os antes de começar.
Este arquivo cobre apenas o que não está lá: fluxo de trabalho e convenções.

Veja também, em `rules/`, a leitura obrigatória com o mesmo peso que este
arquivo: [restrictions.md](rules/restrictions.md) (limites de ação do
agente), [checks.md](rules/checks.md) (verificação antes de declarar uma
tarefa pronta) e [secrets.md](rules/secrets.md) (variáveis de ambiente e
chaves). A identidade visual está em
[docs/adr/002-design-system.md](docs/adr/002-design-system.md).

## Estado atual do repositório

O estado atual do trabalho (o que já existe, o que falta, próximos passos
e dúvidas em aberto) é mantido em [docs/handoff.md](docs/handoff.md), não
aqui. **Leia esse arquivo antes de começar qualquer tarefa** e
atualize-o ao final de uma sessão de trabalho relevante.

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

## Verificação de specs

Quando todas as tarefas de uma spec em `docs/specs/<feature>/` estiverem
concluídas, e antes de declará-la pronta, acione o subagent
`verificador-spec` ([.claude/agents/verificador-spec.md](.claude/agents/verificador-spec.md)),
informando o caminho da `spec.md` e o que verificar (intervalo de commits
ou arquivos). Ele só lê e roda lint/test/build, não edita nada, e devolve
a tabela de critérios de aceite com o veredito. Subagents do projeto ficam
em `.claude/agents/`.

## Antes de considerar uma tarefa concluída

Sempre que os workspaces já tiverem os scripts correspondentes, rode
`lint`, `test` e `build` (via Turborepo, ex.: `pnpm turbo run lint test
build --filter=...[origin/main]`) antes de dar a tarefa por concluída. Não
pule essa etapa mesmo que ainda não exista CI configurado.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
