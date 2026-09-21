---
description: O que precisa passar antes de declarar uma tarefa pronta
globs: []
alwaysApply: true
---

# Verificação de fim de tarefa
> leitor: agente

## Quando
Sempre que você for dizer "pronto", "implementado" ou "funcionando".

## Procedimento
1. Rode `pnpm turbo run test --filter=...[origin/main]`. Cole a última
   linha da saída na resposta.
2. Se a tarefa tocou em migration, rode `prisma migrate reset` (ou
   `supabase db reset`, ambos co-responsáveis pelas migrações — ver
   [docs/adr/001-stack.md](docs/adr/001-stack.md)) local e confirme que o
   banco sobe do zero com todas as migrations.
3. Rode `pnpm turbo run build --filter=...[origin/main]` antes de
   qualquer push. Build que quebra na Vercel é o feedback mais lento e
   mais caro deste projeto.
4. Rode `git status --short`. Só podem aparecer arquivos do escopo
   da tarefa (ver [rules/restrictions.md](rules/restrictions.md) sobre escopo).
5. Diga qual item do [docs/PRD.md](docs/PRD.md) esta tarefa atende (ex:
   "PRD item 3: solicitar empréstimo").

## Verificação
Pronto = os quatro comandos terminaram sem falha E o git status não
trouxe surpresa. As duas coisas, não uma.

## Não faça
- Não relate sucesso parcial. Teste vermelho é tarefa não terminada,
  mesmo que o código "esteja certo".
- Não tente consertar a mesma falha duas vezes seguidas sem me mostrar
  a saída do erro.
- Não rode teste contra o banco remoto.
