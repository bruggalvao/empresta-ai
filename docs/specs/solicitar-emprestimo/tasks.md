# Tasks: Solicitar empréstimo

Baseado em: [plan.md](./plan.md)

Cada item deve ser pequeno o suficiente para revisar sozinho e verificável
(dá para dizer com certeza se está feito ou não). Marque conforme conclui.

## Dados / backend

- [x] `CurrentMembership` (tenant, papel, limite e prazo do vínculo) usado por `/v1/me` e pelos novos endpoints
- [x] Problem Details com 409 e membro `reason`
- [x] `GET /v1/equipment` com situação derivada e sem dados de empréstimo de outra pessoa
- [x] `POST /v1/loans` (transação com `FOR UPDATE`, regras, corrida no índice, auditoria)
- [x] `GET /v1/loans/mine`
- [x] Testes da API: CA-1 a CA-6

## Frontend

- [x] Cliente da API com `ApiError.reason` e `Services = { auth, api }`
- [x] Layout com a barra (abas como links, Operações sem "Meus empréstimos") e rotas `/catalogo`, `/meus-emprestimos`
- [x] Regras do botão por item (`loanRules`) e Catálogo com fotos, busca, filtros e banner de atraso
- [x] Modal de confirmação, toast e recusa com motivo
- [x] Tela Meus empréstimos
- [x] Testes do front: CA-7 a CA-12; testes da spec login ajustados às abas

## Verificação

- [x] Testes automatizados cobrindo os critérios de aceite da spec
- [x] `lint`, `test` e `build` passando (ver [checks.md](../../../rules/checks.md))
- [x] Critérios de aceite do [spec.md](./spec.md) revalidados manualmente
