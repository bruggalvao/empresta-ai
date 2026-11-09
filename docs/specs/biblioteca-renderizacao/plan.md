# Plan: Biblioteca de renderização de fotos de equipamento

Baseado em: [spec.md](./spec.md)

## Resumo técnico

Dois componentes React em `apps/web/src/lib/equipment-photo/`:
`EquipmentPhotoArea` (provê um contexto e renderiza o crédito) e
`EquipmentPhoto` (só renderiza dentro do contexto). A URL da foto é
sempre montada pela biblioteca a partir de um caminho validado; a tela
nunca passa URL. Testes com Vitest + Testing Library em jsdom.

## Modelo de dados

Nenhuma mudança nesta spec. A coluna com o caminho da foto do
equipamento é da spec de dados iniciais (Entrega 3); a biblioteca recebe
o caminho do objeto no bucket (ex.: `TI-0001.jpg`).

## Contrato de API

Nenhum. A foto é lida direto da URL pública do Storage; não passa pela
API.

## Frontend

```
apps/web/src/lib/equipment-photo/
  storage.ts                 — bucket, validação do caminho, montagem da URL
  EquipmentPhotoArea.tsx     — contexto + crédito "Fotos: Pixabay"
  EquipmentPhoto.tsx         — foto 4:3 ou substituto
  index.ts                   — API pública (só o que as telas usam)
  *.test.ts(x)               — um teste por CA, nome cita o ID
```

- `isValidPhotoPath(path)`: aceita só nome de arquivo simples
  (`^[A-Za-z0-9][A-Za-z0-9._-]*\.(jpe?g|png|webp)$`, sem `..`).
- `photoPublicUrl(path, baseUrl)`: `<base>/storage/v1/object/public/equipamentos/<path>`;
  `baseUrl` vem de `import.meta.env.VITE_SUPABASE_URL` (já existe nos
  quatro lugares da [rules/secrets.md](../../../rules/secrets.md)). Não
  instancia o client do Supabase: URL pública não precisa de chave.
- `EquipmentPhoto({ path, name })`: `<img>` com `width=800`,
  `height=600`, `loading="lazy"`, `alt={name}`, classes
  `aspect-[4/3] w-full object-cover`; caminho ausente, inválido ou erro
  de carga → substituto `role="img"` com `aria-label="Sem foto: <nome>"`,
  mesma proporção, cores de `--color-surface`/`--color-status-off-*`
  ([ADR 002](../../adr/002-design-system.md)).
- `EquipmentPhotoArea({ children })`: renderiza os filhos e, ao final, o
  crédito "Fotos: Pixabay" (link `https://pixabay.com/`,
  `target="_blank" rel="noopener noreferrer"`).
- Fora da área: `EquipmentPhoto` retorna `null` e faz `console.error` em
  desenvolvimento.

## Decisões técnicas e alternativas consideradas

- **Caminho em vez de URL como entrada.** Com URL, "só do bucket" seria
  uma checagem de prefixo fácil de contornar; com caminho, a origem é
  garantida por construção. Alternativa descartada: aceitar URL e
  validar o host.
- **Crédito na área, não na foto.** Um crédito por foto poluiria o
  catálogo; um crédito por tela, posto à mão, depende de lembrar. A área
  amarra os dois: não há foto sem área e não há área sem crédito.
- **Teste estático para "caminho único" (CA-9)** em vez de regra de lint
  customizada: o oxlint não tem regra pronta para isso e o teste roda no
  mesmo `turbo run test`.
- **Vitest + Testing Library + jsdom**: Vitest é o que a ADR 001 §2.8
  define para o front; Testing Library e jsdom são as dependências
  utilitárias usuais para testar componente React com ele. O workspace
  `web` ganha o script `test`, que ainda não existia.

## Riscos e dependências

- Depende do bucket público `equipamentos` existir no Supabase do
  deploy — criado pelo upload da skill `imagens-equipamentos`.
- A Entrega 4 pede catálogo "sem rodapé nem texto de crédito" (item 9 do
  briefing), o que contradiz CA-7. A decisão fica para a spec da
  Entrega 4; esta biblioteca não oferece forma de esconder o crédito.
- Trocar uma foto mantendo o mesmo caminho pode servir a versão antiga
  pelo cache da CDN do Storage por um tempo.
