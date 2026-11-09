# Tasks: Biblioteca de renderização de fotos de equipamento

Baseado em: [plan.md](./plan.md)

Cada item deve ser pequeno o suficiente para revisar sozinho e verificável
(dá para dizer com certeza se está feito ou não). Marque conforme conclui.

## Frontend

- [ ] Configurar Vitest + Testing Library + jsdom no `apps/web` e criar o script `test`
- [ ] `storage.ts`: validação do caminho e montagem da URL pública (CA-1, CA-3)
- [ ] `EquipmentPhotoArea`: contexto e crédito "Fotos: Pixabay" (CA-7)
- [ ] `EquipmentPhoto`: foto 4:3, substituto, erro de carga, alt e fora da área (CA-2, CA-4, CA-5, CA-6, CA-8)
- [ ] Teste estático de caminho único sobre `apps/web/src` (CA-9)

## Verificação

- [ ] Testes automatizados cobrindo os critérios de aceite da spec
- [ ] `lint`, `test` e `build` passando (ver [checks.md](../../../rules/checks.md))
- [ ] Critérios de aceite do [spec.md](./spec.md) revalidados manualmente
