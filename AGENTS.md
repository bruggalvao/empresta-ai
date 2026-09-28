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

## Antes de considerar uma tarefa concluída

Sempre que os workspaces já tiverem os scripts correspondentes, rode
`lint`, `test` e `build` (via Turborepo, ex.: `pnpm turbo run lint test
build --filter=...[origin/main]`) antes de dar a tarefa por concluída. Não
pule essa etapa mesmo que ainda não exista CI configurado.
