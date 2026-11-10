# Plan: Dados iniciais

Baseado em: [spec.md](./spec.md)

Escopo de código: `apps/api/prisma` · `apps/api/prisma.config.ts` · `apps/api/package.json` · `apps/api/jest.config.js` · `packages/equipment-images/equipamentos.json` · `packages/equipment-images/creditos.json` · `.claude/hooks/guard-production-db.mjs`

O escopo inclui a lista de equipamentos e os créditos das fotos (o seed
lê os dois) e o hook que bloqueia o agente em produção (CA-8).

## Resumo técnico

Uma migration acrescenta `equipment.image_path`. O seed (`prisma/seed.ts`)
passa a ser uma casca fina sobre `prisma/seed/`: valida tudo antes de
gravar, faz upsert de tenant e equipamentos numa transação e garante a
conta do professor no Supabase Auth (Admin API) com perfil e vínculo.
Testes de integração com Jest + Testcontainers (Postgres real), com o Auth
substituído por uma implementação em memória.

## Modelo de dados

Aprovado pelo usuário antes de gerar ([rules/migration.md](../../../rules/migration.md)):

```prisma
model Equipment {
  // ...
  // Object path in the public "equipamentos" bucket (e.g. "TI-0001.jpg"). Null = no photo.
  imagePath String? @map("image_path")
}
```

```sql
ALTER TABLE "equipment"
  ADD CONSTRAINT "equipment_image_path_format"
  CHECK ("image_path" IS NULL
         OR ("image_path" ~* '^[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp)$'
             AND position('..' in "image_path") = 0));
```

Linhas existentes ficam com `image_path = NULL`. Nenhuma tabela nova; a
política `deny_all` de `equipment` continua valendo.

## Contrato de API

Nenhum.

## Seed

```
apps/api/prisma/seed.ts            — entrada (prisma db seed): monta dependências reais e chama runSeed
apps/api/prisma/seed/data.ts       — lê equipamentos.json + creditos.json, valida, mapeia categoria/situação
apps/api/prisma/seed/guard.ts      — assertSafeTarget: com CLAUDECODE, DIRECT_URL e SUPABASE_URL têm de ser locais
apps/api/prisma/seed/auth.ts       — AuthAdmin (interface) + implementação Supabase (Admin API, service_role)
apps/api/prisma/seed/run.ts        — runSeed(prisma, auth, input): valida → transação → conta → perfil/vínculo
apps/api/prisma/seed/*.spec.ts     — um teste por CA (Testcontainers + AuthAdmin em memória)
```

- **Ordem**: toda validação (senha presente, 12 itens, foto para cada um,
  categorias conhecidas) acontece antes da primeira escrita (CA-7).
- **Equipamento**: `upsert` por `(tenant_id, asset_tag)`; `update` só
  mexe em nome, categoria e `image_path`; `create` define a situação.
- **Conta**: procura por e-mail na Admin API; se não existe, cria com
  `email_confirm: true` e a senha de `PROFESSOR_INITIAL_PASSWORD`; se
  existe, não altera. Perfil (`upsert` por `user_id`) e vínculo `EMPLOYEE`
  (`upsert` por `(tenant_id, user_id)`).
- **Variáveis** ([rules/secrets.md](../../../rules/secrets.md)):
  `PROFESSOR_INITIAL_PASSWORD` (nova) em `apps/api/.env` e
  `.env.example`; o seed usa também `DIRECT_URL`, `SUPABASE_URL` e
  `SUPABASE_SERVICE_ROLE_KEY`, que já existem. Projetos Vercel: o seed
  não roda na Vercel; a decisão de cadastrar ou não fica registrada no
  ENTREGA.md, como na `PIXABAY_API_KEY`.
- **Dependência nova**: `@supabase/supabase-js` em `apps/api` (cliente
  Admin; já usado pelo front e pela ferramenta de imagens).
  `testcontainers` + `@testcontainers/postgresql` como devDependencies
  (ADR 001 §2.8).

## Proteção de produção (CA-8)

- `.claude/hooks/guard-production-db.mjs` (PreToolUse, Bash/PowerShell):
  nega ao agente `prisma migrate dev|reset|deploy`, `prisma db seed`,
  `prisma db push`, `db:deploy` e `db:seed`, **exceto** quando o próprio
  comando define `DIRECT_URL` apontando para `localhost`/`127.0.0.1`.
  Sem isso, o `prisma.config.ts` carregaria o `DIRECT_URL` de produção do
  `apps/api/.env`.
- `assertSafeTarget` no seed: com `CLAUDECODE` definido, `DIRECT_URL` e
  `SUPABASE_URL` precisam ser locais; senão o seed para antes de conectar.
- `assertSafePrismaCommand` no `prisma.config.ts` (carregado por todo
  comando do Prisma, com o argv já expandido pelo shell): com `CLAUDECODE`,
  `migrate dev|reset|deploy|resolve` e `db push|seed|execute` exigem
  `DIRECT_URL` local. Acrescentado depois que o verificador achou disfarces
  de shell (`de${X}ploy`) e `git rebase --exec` que passavam pelo hook.
- Limite aceito: agente que remove `CLAUDECODE` de propósito não é coberto
  (ver tabela de decisões da spec).

## Decisões técnicas e alternativas consideradas

- **Lista e créditos lidos de `packages/equipment-images`** em vez de
  copiados para o seed: uma fonte só para os dados "iguais para todos" e
  para o nome do arquivo de cada foto. Alternativa descartada: duplicar a
  lista no seed (risco de divergir, como já divergiu briefing × lista).
- **Auth atrás de interface**: o Postgres local não tem o Supabase Auth;
  a interface permite testar a lógica de conta sem tocar em Auth real.
  A conferência da conta real é o CA-9 (manual, em produção).
- **Situação não é atualizada na re-execução**: depois da carga ela é de
  Operações (ver tabela de decisões da spec).

## Riscos e dependências

- Depende do usuário: aplicar a migration (`db:deploy`) e rodar o seed
  (`db:seed`) no banco de produção, com `apps/api/.env` apontando para o
  Empresta.AI Project.
- O projeto Supabase tem tabelas de outros sistemas; a limpeza é do
  usuário, fora do repositório. Nenhum nome colide com as tabelas do
  empresta-ai.
- A Admin API não busca usuário por e-mail diretamente: a busca pagina
  `listUsers`, aceitável para o volume do projeto.
