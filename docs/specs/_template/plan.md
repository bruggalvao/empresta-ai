# Plan: <Nome da feature>

Baseado em: [spec.md](./spec.md)

Escopo de código: `apps/<app>/src/<pasta>` · `apps/<app>/package.json`

O escopo lista, entre crases, todo código que pode mudar o resultado dos
critérios de aceite (inclusive configuração de teste e build). Depois que o
verificador aprova a spec, só mudança dentro do escopo invalida o registro.
Sem esta linha, qualquer código do repositório invalida. Mudar o escopo
também exige verificar de novo.

## Resumo técnico

Uma ou duas frases sobre a abordagem escolhida.

## Modelo de dados

Tabelas/colunas novas ou alteradas no Supabase (Postgres). Inclua tipos,
constraints e RLS relevantes.

```sql
-- exemplo
```

## Contrato de API

Endpoints novos ou alterados (`apps/api`), refletidos em
`packages/api-contract`. Para cada endpoint: método, rota, request,
response, erros esperados.

## Frontend

Componentes, rotas e estados novos em `apps/web`. Referencie os tokens e
componentes do [LAYOUT.md](../../LAYOUT.md) que se aplicam.

## Decisões técnicas e alternativas consideradas

Decisões que não são óbvias a partir do spec.md, e por que foram tomadas
assim. Se uma decisão tem impacto amplo no projeto (não só nesta
feature), considere registrar uma ADR em `docs/adr/` em vez de só aqui.

## Riscos e dependências

O que pode dar errado, e de que outras specs/features/infra isso depende.
