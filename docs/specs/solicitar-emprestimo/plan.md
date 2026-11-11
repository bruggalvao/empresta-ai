# Plan: Solicitar empréstimo

Baseado em: [spec.md](./spec.md)

Escopo de código: `apps/api/src` · `apps/api/api` · `apps/api/package.json` · `apps/api/tsconfig.json` · `apps/api/tsconfig.build.json` · `apps/api/jest.config.js` · `apps/api/vercel.json` · `apps/api/prisma/schema.prisma` · `apps/api/prisma/migrations` · `apps/web/src` · `apps/web/index.html` · `apps/web/package.json` · `apps/web/vite.config.ts` · `apps/web/vitest.config.ts` · `apps/web/vercel.json`

## Resumo técnico

Três endpoints novos na API (catálogo, solicitar, meus empréstimos), todos
atrás do `AuthGuard` da spec login e com tenant e papel resolvidos pelo
vínculo da pessoa do token. "Solicitar" é uma transação que trava o vínculo
da pessoa (`FOR UPDATE`), confere as regras, cria o empréstimo e a linha de
auditoria; a corrida no mesmo equipamento é barrada pelo índice único
parcial que já existe. No front, as telas Catálogo e Meus empréstimos ficam
dentro de um layout com a barra de navegação, com TanStack Query.

## Modelo de dados

Nenhuma migration. Usa o que a migration inicial já tem:

- `loans_one_open_per_equipment` (único parcial em `equipment_id` com
  `returned_at IS NULL`): dois empréstimos em aberto para o mesmo item são
  impossíveis no banco (CA-4).
- `loans_open_by_borrower`: empréstimos em aberto da pessoa (limite,
  atraso, Meus empréstimos).
- `tenants.loan_limit` (3) e `tenants.loan_period_days` (14).
- `audit_log` append-only (CA-2).

"Hoje" vem do banco: `(now() AT TIME ZONE 'America/Sao_Paulo')::date`,
para o servidor (UTC na Vercel) e o banco concordarem.

## Contrato de API

Todos exigem `Authorization: Bearer`. 401 e 403 como na spec login (conta
sem vínculo único → 403).

`GET /v1/equipment` → 200, ordenado por patrimônio:

```json
{ "items": [{
  "id": "uuid", "assetTag": "TI-0001", "name": "Notebook 14 polegadas",
  "category": "NOTEBOOK", "imagePath": "TI-0001.jpg", "notes": null,
  "situation": "AVAILABLE" | "MAINTENANCE" | "LOANED" | "MINE",
  "dueDate": "2026-11-24", "overdue": false
}] }
```

`dueDate` e `overdue` só vêm quando `situation = "MINE"`. Empréstimo de
outra pessoa é `LOANED`, sem id, nome nem prazo. Item com empréstimo em
aberto é `LOANED`/`MINE` mesmo se estiver `MAINTENANCE` (não ocorre na v1:
ninguém muda a situação de item emprestado).

`POST /v1/loans` com corpo `{ "equipmentId": "uuid" }` → 201:

```json
{ "id": "uuid", "equipmentId": "uuid", "loanedAt": "ISO", "dueDate": "2026-11-24" }
```

Recusas em Problem Details com o membro de extensão `reason` (RFC 9457 §3.2):

| status | `reason` | quando |
|---|---|---|
| 400 | `invalid_request` | `equipmentId` ausente ou não é UUID |
| 403 | `employees_only` | papel `OPERATIONS` |
| 404 | `not_found` | equipamento inexistente ou de outro tenant |
| 409 | `maintenance` | `status = MAINTENANCE` |
| 409 | `already_loaned` | empréstimo em aberto no item (inclusive pela violação do índice único numa corrida) |
| 409 | `overdue` | pessoa com empréstimo em atraso |
| 409 | `loan_limit` | pessoa com `loan_limit` empréstimos em aberto |

Ordem das checagens: 404 → manutenção → emprestado → atraso → limite.

`GET /v1/loans/mine` → 200:

```json
{ "loanLimit": 3, "loanPeriodDays": 14, "loans": [{
  "id": "uuid", "loanedAt": "ISO", "dueDate": "2026-11-24", "overdue": false,
  "equipment": { "id": "uuid", "assetTag": "TI-0001", "name": "...", "category": "NOTEBOOK", "imagePath": "TI-0001.jpg" }
}] }
```

## Backend (`apps/api/src`)

```
auth/membership.ts        — CurrentMembership: resolve(userId) → { userId, tenantId, role, loanLimit, loanPeriodDays } ou 403 (substitui a lógica de MeService)
equipment/                — GET /equipment: controller, service, repository (equipamentos + empréstimo em aberto de cada um)
loans/                    — POST /loans e GET /loans/mine: controller, service (transação), repository
common/problem.filter.ts  — título para 409 e o membro `reason`
common/problem.ts         — exceções com reason (ConflictProblem etc.)
```

Transação de solicitar (Prisma interativa):

1. `SELECT 1 FROM memberships WHERE tenant_id = $1 AND user_id = $2 FOR UPDATE`
   (serializa pedidos da mesma pessoa: limite sem corrida, modelagem-dados).
2. Equipamento por `id` e `tenant_id` → 404.
3. Manutenção → 409; empréstimo em aberto no item → 409.
4. Atraso (`due_date < hoje`) → 409; contagem de abertos ≥ `loan_limit` → 409.
5. `INSERT` do empréstimo com `due_date = hoje + loan_period_days`; P2002
   no índice parcial → 409 `already_loaned`.
6. `audit_log`: `action = "loan.created"`, `entity_type = "loan"`,
   `metadata = { equipmentId, dueDate }`.

## Frontend (`apps/web/src`)

```
lib/api/client.ts         — apiFetch + ApiError(status, detail, reason); Api = { me, equipment, myLoans, requestLoan }
lib/dates.ts              — DD/MM/AAAA, "hoje" em America/Sao_Paulo, hoje + N dias
app/AppLayout.tsx         — RequireSession → /v1/me (403/401 como na spec login) → Navbar + Outlet
app/routes.tsx            — /inicio, /catalogo, /meus-emprestimos dentro do layout; Operações em /meus-emprestimos → /catalogo
components/Navbar.tsx     — abas com NavLink (aba ativa com borda no acento); sem telas, desabilitadas
pages/Catalog.tsx         — busca + filtros + grade de EquipmentCard dentro de EquipmentPhotoArea; banner de atraso
pages/MyLoans.tsx         — LAYOUT §5.3 sem "Devolver"
components/EquipmentCard.tsx, ConfirmDialog.tsx, Toast.tsx
lib/loanRules.ts          — estado do botão por item (puro, testável): Solicitar / Indisponível / Emprestado / Está com você / Limite de N itens / Bloqueado por atraso
```

- `Services` passa de `{ auth, fetchMe }` para `{ auth, api }`; testes
  injetam uma API em memória.
- Sem foto fora de `EquipmentPhotoArea` (spec biblioteca, CA-8/CA-9).
- Na spec login, a decisão "abas desabilitadas" continua para as telas que
  não existem; as abas de Operações perdem "Meus empréstimos" (decisão
  desta spec, registrada também na spec login).

## Testes

- API (Jest + supertest + Testcontainers): `src/loans/loans.spec.ts` e
  `src/equipment/equipment.spec.ts`, com dois tenants, colaboradores,
  Operações, itens em manutenção, empréstimos vencidos inseridos direto no
  banco. Corridas com `Promise.all` de requisições reais.
- Web (Vitest): catálogo, modal, Meus empréstimos, Operações, com API em
  memória; `loanRules` com teste de tabela.

## Decisões técnicas e alternativas consideradas

| decisão | alternativa | por quê |
|---|---|---|
| Limite e atraso na API, dentro da transação com `FOR UPDATE` no vínculo | trigger no banco | Já decidido em [modelagem-dados.md](../../modelagem-dados.md): dependem de configuração do tenant e de "hoje" |
| "Hoje" calculado no banco | `Date` no Node | A Vercel roda em UTC; uma fonte só de "hoje" evita divergência perto da meia-noite |
| `reason` no Problem Details | só o texto em `detail` | A interface decide o rótulo sem comparar texto |
| Sem orval/`packages/api-contract` | cliente gerado | Mesmo motivo da spec login: o pacote não existe ainda |

## Riscos e dependências

- Depende das specs login (guard, `/v1/me`, sessão), dados-iniciais (12
  itens em produção) e biblioteca-renderizacao (fotos com crédito).
- Muda `apps/web/src` e `apps/api/src`: as specs login e
  biblioteca-renderizacao precisam ser verificadas de novo.
- Produção (CA-13) depende do deploy da spec login (variáveis na Vercel,
  conta de teste, `main`).
