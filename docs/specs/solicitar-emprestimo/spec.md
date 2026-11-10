# Spec: Solicitar empréstimo

Status: implementada
Referências: [PRD.md](../../PRD.md) (itens 1, 2 e 3; regras de Operações) · [LAYOUT.md](../../LAYOUT.md) §5.2, §5.3, §5.6, §6, §7 · [ADR 001](../../adr/001-stack.md) §2.4, §2.6, §2.8, §2.10 · [ADR 002](../../adr/002-design-system.md) · [modelagem-dados.md](../../modelagem-dados.md) · specs [login](../login/spec.md), [dados-iniciais](../dados-iniciais/spec.md), [biblioteca-renderizacao](../biblioteca-renderizacao/spec.md) · briefing "solicitar empréstimo" da prática

## Problema

O colaborador entra no sistema e não vê nenhum equipamento, nem consegue
pegar um emprestado. Ele continua dependendo da planilha para saber o que
está disponível e para registrar a retirada.

## Quem usa

- Colaborador (`EMPLOYEE`): vê o catálogo, solicita um item disponível e
  acompanha os próprios empréstimos em aberto.
- Operações (`OPERATIONS`): vê o catálogo, só para consulta.

## Comportamento esperado

- Dado que entrei, quando abro o Catálogo, então vejo os equipamentos do
  meu tenant com foto, nome, categoria, patrimônio e situação, e posso
  buscar por nome ou patrimônio e filtrar por situação.
- Dado um equipamento disponível e que estou dentro das regras, quando
  clico em "Solicitar" e confirmo, então o empréstimo é criado na hora com
  devolução prevista para daqui a 14 dias, o item deixa de estar disponível
  e passa a aparecer em "Meus empréstimos".
- Dado que clico em "Solicitar", quando cancelo a confirmação, então nada
  é criado.
- Dado um item em manutenção ou emprestado, então não consigo solicitá-lo.
- Dado que já estou com 3 itens, ou com um item em atraso, então não
  consigo solicitar outro e vejo o motivo.
- Dado que outra pessoa pediu o mesmo item ao mesmo tempo que eu, então só
  um empréstimo é criado e quem perdeu vê que o item já foi emprestado.
- Dado que estou em "Meus empréstimos", então vejo só os meus itens em
  aberto, com a data de retirada e a de devolução prevista.

## Regras de negócio envolvidas

Do PRD (valem sobre o briefing quando divergem):

- Cada pessoa pode estar com no máximo **3 itens** ao mesmo tempo
  (`tenants.loan_limit`, padrão 3).
- O prazo padrão de devolução é de **14 dias** (`tenants.loan_period_days`,
  padrão 14): `devolução prevista = hoje + 14 dias corridos`, com "hoje" no
  fuso `America/Sao_Paulo` ([modelagem-dados.md](../../modelagem-dados.md),
  decisão 4).
- Quem tem item em atraso não pode pegar outro emprestado. Em atraso:
  empréstimo em aberto com devolução prevista anterior a hoje.
- Equipamento em manutenção não aparece como disponível e não pode ser
  solicitado.
- Cada pessoa vê os próprios empréstimos (PRD item 1).

Do briefing e já decidido para a turma: solicitar cria o empréstimo na
hora, sem aprovação de Operações nem fila.

Situação no catálogo, derivada e não armazenada
([modelagem-dados.md](../../modelagem-dados.md)):

| situação | quando | o que o colaborador vê |
|---|---|---|
| Disponível | `status = AVAILABLE` e sem empréstimo em aberto | pill "Disponível", botão "Solicitar" |
| Em manutenção | `status = MAINTENANCE` | pill "Em manutenção", observação, botão "Indisponível" desabilitado |
| Com você | empréstimo em aberto da própria pessoa | pill "Emprestado" (ou "Em atraso"), "Devolver até DD/MM/AAAA", botão "Está com você" desabilitado |
| Emprestado | empréstimo em aberto de outra pessoa | pill "Emprestado", botão "Emprestado" desabilitado, sem nome nem prazo |

### Decisões (conflitos e lacunas)

| ponto | fonte | decisão | por quê |
|---|---|---|---|
| Limite de itens | briefing item 4 ("5 empréstimos") × PRD ("no máximo 3 itens") | 3, lido de `tenants.loan_limit` | Regra de negócio é do PRD; o modelo e o LAYOUT já usam 3. Decisão do usuário |
| Prazo | briefing item 3 ("14 dias úteis") × PRD ("14 dias") | 14 dias corridos, sem ajuste para fim de semana | PRD e modelo de dados (`loan_period_days`); dia útil exigiria calendário de feriados que nenhum documento define. Decisão do usuário |
| Crédito das fotos | briefing item 9 ("sem rodapé nem texto de crédito") × spec biblioteca-renderizacao (CA-7) e condições do Pixabay | O catálogo usa `EquipmentPhotoArea`, que mostra "Fotos: Pixabay" com link. O item 9 é recusado | Tirar o crédito quebraria o contrato da biblioteca, os termos do Pixabay e a conferência final da prática. Decisão do usuário |
| Quem solicita | PRD ("Colaborador: … pede um item emprestado") × LAYOUT §6 (Operações tem "Meus empréstimos") | Só `EMPLOYEE`. Operações vê o catálogo só para consulta, sem botão, e a aba "Meus empréstimos" sai da barra de Operações. A API responde 403 se Operações tentar | Leitura estrita do PRD. Decisão do usuário |
| Item com outra pessoa | LAYOUT §5.2 ("Com {pessoa} · devolver até {data}") × PRD item 1 | Só "Emprestado", sem nome nem prazo; atraso de outra pessoa também aparece só como "Emprestado" | Cada pessoa vê só os próprios empréstimos. Decisão do usuário |
| Confirmação | briefing ("cria na hora") × LAYOUT §7.1 (modal) | Modal com "Devolver até"; Confirmar cria na hora | "Na hora" é sem aprovação de terceiros; a confirmação evita empréstimo por clique acidental. Decisão do usuário |
| Busca e filtros | LAYOUT §7.8, §7.9; não estão no PRD nem no briefing | Incluídos | Decisão do usuário |
| Devolução e tela de Operações | LAYOUT §5.3 (botão "Devolver"), §5.4 | Fora: "Meus empréstimos" não tem botão "Devolver" | Fora de escopo no briefing; PRD itens 4 e 5 ficam para specs próprias |
| Tela inicial | spec login (`/inicio` com boas-vindas) | `/inicio` continua sendo a entrada após o login; as abas "Catálogo" e "Meus empréstimos" passam a ser links para `/catalogo` e `/meus-emprestimos`. Abas de telas que não existem seguem desabilitadas | Não muda o comportamento aprovado do login |
| Auditoria | ADR 001 §2.10 | Cada empréstimo criado grava uma linha em `audit_log` na mesma transação | Tabela append-only já existe; registrar quem pegou o quê é o motivo do produto |
| Conta do professor | regra da prática | Testes em produção usam conta de teste própria; a do professor continua com zero empréstimos | Regra da prática |

## Critérios de aceite

Cada critério tem um ID fixo (`CA-1`, `CA-2`, ...), citado no nome do
teste que o prova. IDs não são renumerados: um CA removido deixa o número
vago. Mudar o texto desta seção invalida as verificações anteriores.

- [ ] CA-1: `GET /v1/equipment` devolve os equipamentos do tenant do token (id, patrimônio, nome, categoria, caminho da foto, observação e situação derivada conforme a tabela de situação). Para empréstimo da própria pessoa traz a devolução prevista; para empréstimo de outra pessoa não traz nome, id nem prazo. Nunca devolve equipamento de outro tenant.
- [ ] CA-2: `POST /v1/loans` com o id de um equipamento disponível, feito por `EMPLOYEE` dentro das regras, cria o empréstimo com retirada agora e devolução prevista = hoje em `America/Sao_Paulo` + `loan_period_days` dias corridos, e grava `loan.created` em `audit_log` na mesma transação. Responde 201 com o empréstimo, e o equipamento passa a constar como "Com você".
- [ ] CA-3: `POST /v1/loans` recusa, sem criar empréstimo nem auditoria e em Problem Details com o motivo: equipamento em manutenção (409), equipamento já emprestado (409), pessoa com `loan_limit` empréstimos em aberto (409), pessoa com empréstimo em atraso (409), equipamento inexistente ou de outro tenant (404).
- [ ] CA-4: Pedidos simultâneos ao mesmo equipamento criam exatamente um empréstimo, e os outros recebem 409 de item já emprestado. Pedidos simultâneos da mesma pessoa a equipamentos diferentes nunca a deixam com mais de `loan_limit` em aberto.
- [ ] CA-5: Só `EMPLOYEE` solicita: `OPERATIONS` recebe 403. Pessoa e tenant vêm só do token; `borrowerId` ou `tenantId` enviados no corpo, na query ou em cabeçalho são ignorados.
- [ ] CA-6: `GET /v1/loans/mine` devolve só os empréstimos em aberto da pessoa do token, com equipamento (nome, patrimônio, categoria), retirada e devolução prevista; nunca empréstimos de outra pessoa nem já devolvidos.
- [ ] CA-7: A tela Catálogo (`/catalogo`) mostra cada equipamento com a foto pela biblioteca de renderização (com o crédito "Fotos: Pixabay"), categoria, nome, patrimônio, pill de situação, linha de detalhe e o botão conforme a tabela de situação, e a contagem "X de Y equipamentos disponíveis agora".
- [ ] CA-8: Com `loan_limit` itens em aberto, todo botão de solicitar fica desabilitado com o rótulo "Limite de 3 itens"; com item em atraso, os botões ficam desabilitados com "Bloqueado por atraso" e um banner no topo do catálogo leva a "Meus empréstimos".
- [ ] CA-9: "Solicitar" abre um modal com o equipamento e "Devolver até DD/MM/AAAA"; "Confirmar" cria o empréstimo, mostra um toast, e o item passa a "Está com você" e aparece em "Meus empréstimos"; "Cancelar" ou clique fora fecham sem criar. Se a API recusar, o modal mostra o motivo da recusa.
- [ ] CA-10: Para Operações, o catálogo não tem botão de solicitar e a barra não tem a aba "Meus empréstimos".
- [ ] CA-11: A busca filtra o catálogo por nome e patrimônio, sem diferenciar maiúsculas, a cada tecla; os filtros Todos · Disponíveis · Emprestados · Em manutenção são exclusivos e combinam com a busca; sem resultado, aparece um estado vazio.
- [ ] CA-12: A tela "Meus empréstimos" (`/meus-emprestimos`) mostra "N de 3 itens em seu nome · prazo padrão de 14 dias", a barra de 3 traços e uma linha por empréstimo em aberto com item, retirada, devolução prevista (DD/MM/AAAA) e pill; sem empréstimos, mostra o estado vazio com "Ir ao catálogo".
- [ ] CA-13: Em produção, pelo link da Vercel e com a conta de teste do usuário: o catálogo mostra os 12 equipamentos com foto e crédito; `TI-0004`, `TI-0007` e `TI-0010` não podem ser solicitados; solicitar um disponível cria o empréstimo e o tira do disponível; ao chegar a 3, a recusa mostra o motivo; "Meus empréstimos" mostra os itens e as datas; consulta somente leitura confirma que a conta do professor continua com zero empréstimos. (Verificação manual.)

## Fora de escopo

- Devolver item e registrar devolução no balcão (PRD itens 4 e 5).
- Tela de Operações, cadastro de equipamento e edição de situação.
- Reserva com data futura, notificação por e-mail, renovação (briefing e
  PRD).
- Prazo em dias úteis e calendário de feriados.
- Limpar empréstimos de teste em produção: feito pelo usuário, com a conta
  de teste dele.
