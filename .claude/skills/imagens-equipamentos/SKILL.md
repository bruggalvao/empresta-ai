---
name: imagens-equipamentos
description: Obtém, recorta e prepara as fotos dos equipamentos do empresta-ai a partir do Pixabay (800×600, com créditos e revisão), para envio ao Supabase Storage por uma pessoa. Use quando o pedido envolver foto de equipamento — buscar, trocar, reprovar, revisar, conferir créditos ou preparar o envio. Não use para exibir fotos na tela (isso é a biblioteca em apps/web/src/lib/equipment-photo) nem para imagens que não são de equipamento (landing, logo).
---

# imagens-equipamentos

Toda foto de equipamento do sistema sai deste fluxo. O código fica em
`packages/equipment-images/`; esta skill diz como usá-lo e o que **não**
é com você.

## Fluxo

1. **Preparar** (você pode rodar):
   `pnpm --filter equipment-images images:prepare [TI-0001 ...]`
   (sem `pnpm` no PATH: `npx -y pnpm@12.5.1 ...`). Busca no Pixabay com o
   termo de `equipamentos.json`, descarta candidatas pelas regras de
   `src/selection.mjs`, baixa, recorta para 800×600, grava em `out/` e
   registra o crédito em `creditos.json`. Rodar de novo mantém toda foto
   ainda válida. Gera `out/revisao.html`.
2. **Revisar** (a pessoa decide): mostre ao usuário o caminho de
   `out/revisao.html` e peça a revisão por amostragem. Você não aprova
   foto por ninguém.
3. **Reprovar** (você roda, só com o motivo dado pelo usuário):
   `pnpm --filter equipment-images images:reject TI-0003 "motivo"`, depois
   `images:prepare TI-0003` para escolher outra. A reprovação fica em
   `rejeicoes.json` e aquela foto nunca mais é escolhida.
4. **Enviar** (só a pessoa): diga ao usuário para rodar no terminal dele
   `pnpm --filter equipment-images images:upload`. Um hook bloqueia esse
   comando para você e o script se recusa a rodar com `CLAUDECODE`
   definido. Não tente contornar nenhum dos dois.

## Regras

- Fonte única: API do Pixabay com `PIXABAY_API_KEY` (lida de
  `apps/api/.env` pelo próprio script). Não leia o `.env`, não peça a
  chave, não use outra origem de imagem — nem "só para testar".
- Não edite `creditos.json`, `rejeicoes.json` nem arquivos de `out/` à
  mão: eles são saída dos scripts e evidência da origem de cada foto.
- Não mude `BLOCKED_TAGS`, `CATEGORY_TAGS`, tamanho ou bucket em
  `src/config.mjs` sem decisão explícita do usuário: isso muda o que a
  skill garante.
- Se um equipamento ficar sem candidata, informe o motivo que o
  `prepare` imprimiu e pergunte ao usuário. Não troque o termo de busca
  de `equipamentos.json` por conta própria: a lista é a mesma para toda
  a turma.
- Nenhuma dependência nova sem checar [ADR 003](../../../docs/adr/003-processamento-de-imagens.md)
  e [rules/restrictions.md](../../../rules/restrictions.md).

## Referências

- [references/contrato.md](references/contrato.md) — cada requisito do
  contrato e quem o garante (código, teste, hook, pessoa).
- [references/pixabay.md](references/pixabay.md) — o que a documentação
  da API diz e que afeta este fluxo.
