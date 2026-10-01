---
description: Onde cada variável de ambiente vive e qual chave usar
globs: ["**/.env*"]
alwaysApply: false
---

# Variáveis de ambiente e chaves
> leitor: agente

## Quando
Ao criar ou usar qualquer variável de ambiente, ao instanciar o client
do Supabase, ou ao escrever código que lê configuração.

## Procedimento
1. `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`: chave pública. Só ela
   pode aparecer em código que roda no navegador (`apps/web`). A
   proteção dela é o RLS habilitado em todas as tabelas (ver
   [docs/adr/001-stack.md](../docs/adr/001-stack.md), seção 2.7).
2. `SUPABASE_SERVICE_ROLE_KEY`: bypassa RLS. Só em código de
   `apps/api`, nunca em `apps/web`, nunca em variável com prefixo
   `VITE_`.
3. `SUPABASE_JWT_SECRET` e `SUPABASE_JWKS_URL`: só em `apps/api`, usadas
   para validar o JWT contra os JWKS do Supabase.
4. `DATABASE_URL` (pooler, porta 6543) e `DIRECT_URL` (direta, porta
   5432): só em `apps/api`, nunca no client.
5. Variável nova existe em QUATRO lugares ou em nenhum:
   `apps/api/.env` ou `apps/web/.env` (sua máquina, conforme a
   variável) · `.env.example` na raiz (versionado, sem valor real) ·
   projeto Vercel `empresta-ai-api` · projeto Vercel `empresta-ai-front`
   (só as variáveis que cada projeto usa — ver `.env.example` seção 5).
6. Ao criar uma variável, diga na resposta em quais desses lugares você
   já a colocou e o que falta fazer à mão.

## Verificação
Uma busca por `SERVICE_ROLE` no código de `apps/web` não retorna nada.
`.env.example` tem todas as chaves que o projeto usa, sem nenhum valor
real.

## Não faça
- Não escreva valor de chave em resposta, commit, log ou comentário.
- Não crie variável só no `.env` local. Ela quebra o deploy e o erro só
  aparece no build da Vercel.
- Não contorne o RLS trocando `anon` por `service_role` no front. Se a
  política atrapalha, a política está errada — pare e avise.
- Não leia nem edite `apps/api/.env` ou `apps/web/.env` reais (ver
  [restrictions.md](restrictions.md)) — apenas `.env.example`.
