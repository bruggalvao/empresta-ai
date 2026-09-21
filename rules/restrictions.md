# restrictions.md

Limites de ação do agente neste repositório. Complementa
[AGENTS.md](AGENTS.md) — as regras de confirmação para ações de infra
definidas lá continuam valendo; este arquivo não substitui nem afrouxa nada
de lá.

## Arquivos proibidos

Nunca ler nem editar arquivos `.env` reais (apenas `.env.example` é
permitido), nem qualquer chave privada, certificado ou arquivo de
credenciais.

## Stack e dependências

- Pode instalar dependências pequenas/utilitárias livremente.
- Nunca substituir uma peça já decidida na [ADR 001](docs/adr/001-stack.md)
  (ex.: trocar Prisma, NestJS, Tailwind, Zustand, etc. por outra
  alternativa) sem confirmação explícita.

## Escopo por tarefa

O agente deve ficar restrito ao que foi explicitamente pedido na tarefa
atual. Mudanças fora desse escopo (refactors, limpezas, ajustes em outros
módulos não relacionados) não devem ser feitas direto — devem ser
sinalizadas para decisão à parte.
