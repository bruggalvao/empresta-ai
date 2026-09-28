# Specs (Spec-Driven Development)

Este diretório guarda as specs de feature do empresta.ai. O padrão é
**spec-driven development (SDD)**: antes de implementar uma feature não
trivial, ela é especificada em texto, revisada e só então vira código.

## Quando escrever uma spec

Escreva uma spec para qualquer feature de negócio nova ou mudança de
comportamento visível (fluxo de empréstimo, regra de bloqueio, tela nova,
etc.). Não é necessário para chores, correções pontuais de bug ou trabalho
de infraestrutura sem impacto em comportamento — esses seguem direto para
a branch/PR normal, conforme [AGENTS.md](../../AGENTS.md).

## Relação com os outros docs

- [`docs/PRD.md`](../PRD.md) e [`docs/LAYOUT.md`](../LAYOUT.md) continuam
  sendo a visão geral de produto e design. Eles não descem a esse nível de
  detalhe por feature.
- Cada spec em `docs/specs/<feature>/` **referencia** as partes do PRD e do
  LAYOUT relevantes para aquela feature, em vez de duplicá-las.
- Decisões de arquitetura/stack que valem para o projeto todo continuam em
  [`docs/adr/`](../adr/) como ADRs. Uma spec pode referenciar uma ADR
  existente ou apontar a necessidade de uma nova, mas não substitui uma ADR.

## Estrutura de uma spec

Cada feature ganha uma pasta própria:

```
docs/specs/<nome-curto-da-feature>/
  spec.md   — o quê e por quê (requisitos, escopo, critérios de aceite)
  plan.md   — como (design técnico, dados, contratos, decisões de implementação)
  tasks.md  — checklist de execução, quebrado em passos verificáveis
```

Use `docs/specs/_template/` como ponto de partida: copie os três arquivos
para a nova pasta e preencha.

Nome da pasta: kebab-case, curto, em português, descrevendo a feature
(ex.: `catalogo-equipamentos`, `emprestimo-item`, `bloqueio-atraso`).

## Fluxo

1. **spec.md** — escrito e revisado antes de qualquer código. Descreve o
   comportamento esperado do ponto de vista do usuário, não a
   implementação. Se o escopo mudar durante a implementação, o spec.md é
   atualizado primeiro.
2. **plan.md** — escrito depois que o spec.md está estável. Descreve como a
   feature será construída: modelo de dados, endpoints, componentes,
   pontos de integração com Supabase, etc.
3. **tasks.md** — quebra o plan.md em passos pequenos e verificáveis. É a
   lista que o agente ou dev segue durante a implementação, marcando cada
   item conforme conclui.

Specs concluídas e implementadas permanecem no repositório como registro
histórico — não são apagadas depois do merge.

## Idioma

Specs são documentação voltada ao time e ao produto: seguem a regra do
[AGENTS.md](../../AGENTS.md) de **PT-BR**, exceto nomes de campos, tipos e
trechos de código, que seguem em inglês.
