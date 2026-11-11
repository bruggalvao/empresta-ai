# Tasks: Dados iniciais

Baseado em: [plan.md](./plan.md)

Cada item deve ser pequeno o suficiente para revisar sozinho e verificável
(dá para dizer com certeza se está feito ou não). Marque conforme conclui.

## Dados / backend

- [x] Hook `guard-production-db.mjs` no `settings.json`, testado (CA-8)
- [x] Migration `add_equipment_image_path` gerada no Postgres local e testada do zero (CA-3)
- [x] `seed/guard.ts`: recusa de alvo não local com `CLAUDECODE` (CA-8)
- [x] `seed/data.ts`: leitura e validação de lista e créditos (CA-1, CA-2, CA-3, CA-7)
- [x] `seed/auth.ts`: interface + implementação Supabase Admin
- [x] `seed/run.ts` + `seed.ts`: transação, conta, perfil e vínculo (CA-1 a CA-7)
- [x] Testes de integração com Testcontainers, um por CA
- [x] `PROFESSOR_INITIAL_PASSWORD` no `.env.example`

## Verificação

- [x] Testes automatizados cobrindo os critérios de aceite da spec
- [x] `lint`, `test` e `build` passando (ver [checks.md](../../../rules/checks.md))
- [x] Critérios de aceite do [spec.md](./spec.md) revalidados manualmente
