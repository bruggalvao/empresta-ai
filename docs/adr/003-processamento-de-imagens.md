# ADR 003: Biblioteca de processamento de imagens

- **Status:** Aceito
- **Data:** 2026-11-09
- **Decisores:** Time Técnico (prática SDD, Entrega 2)

## 1. Contexto

O contrato da skill `imagens-equipamentos` exige que toda foto de
equipamento chegue ao Supabase Storage com exatamente 800×600 —
garantido, não apenas pedido. O Pixabay não recorta nem redimensiona: a
maior imagem disponível sem conta aprovada (`largeImageURL`) tem até
1280 px no maior lado e proporção variada. É preciso recortar e reduzir
em código antes do envio.

A [ADR 001](001-stack.md) não cita biblioteca de imagem, e a
[rules/restrictions.md](../../rules/restrictions.md) só libera sem
confirmação dependências "pequenas/utilitárias". O briefing da prática
chegou a sugerir `sharp`.

## 2. Decisão

Usar **jimp** (JavaScript puro) no workspace de ferramenta
`packages/equipment-images`, e só nele. O app (`apps/web`, `apps/api`)
não processa imagem.

## 3. Alternativas descartadas

| alternativa | motivo |
|---|---|
| `sharp` | Rápido e padrão de mercado, mas depende de binário nativo por plataforma e de script de instalação — não é "pequena/utilitária", e o `pnpm-workspace.yaml` bloqueia builds de dependências por padrão. O ganho de velocidade é irrelevante para 12 fotos, rodadas à mão. |
| Transformação de imagem do Supabase | Redimensiona na entrega, não no armazenamento: o arquivo no Storage continuaria fora de 800×600. Além disso é recurso de plano pago. |
| Só aceitar fotos que já venham em 800×600 | O Pixabay não devolve esse tamanho; sobrariam pouquíssimas candidatas e ainda assim nada garantiria o tamanho. |
| Script em outra linguagem (Python + Pillow) | Acrescenta um runtime que a ADR 001 não prevê, sem lint/test no Turborepo. |

## 4. Consequências

- Instalação sem etapa nativa, igual em Windows, macOS, Linux e no CI.
- Processamento mais lento que o `sharp` — aceitável para lote pequeno e
  manual; reavaliar se o projeto passar a processar imagem em produção
  (aí o processamento iria para a API e a decisão seria outra).
- O tamanho é garantido por `toExactSize()` e conferido de novo no upload
  (testes em `packages/equipment-images/test/`).
