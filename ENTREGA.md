# Entrega da prática

> Rascunho escrito antes do deploy (2026-11-10). As partes marcadas com
> **[após o deploy]** são preenchidas depois da conferência em produção e
> antes da tag `entrega-pratica`.

## Links

- Repositório (monorepo: `apps/web` e `apps/api`): https://github.com/bruggalvao/empresta-ai
- Produção (Vercel): **[após o deploy]** front `https://empresta-ai-front.vercel.app`, API `https://empresta-ai-api.vercel.app/v1`

Specs desta prática (todas com `Status: implementada` e registro PRONTA válido,
conferido por `node scripts/spec-verification.mjs check --base main`):
[biblioteca-renderizacao](docs/specs/biblioteca-renderizacao/spec.md) ·
[dados-iniciais](docs/specs/dados-iniciais/spec.md) ·
[login](docs/specs/login/spec.md) ·
[solicitar-emprestimo](docs/specs/solicitar-emprestimo/spec.md).

## 1. Conflitos: o que foi pedido contra o que já existia

| pedido | contrariava o quê | o que você fez | por quê | onde ficou registrado | commit |
|--------|-------------------|----------------|---------|-----------------------|--------|
| Tech lead: "quando a única falha for um teste quebrado, o verificador pode corrigir o teste e verificar de novo" | Requisito "Independência" da Entrega 1 ("Não corrige o que encontra") | Recusado. O verificador não tem `Edit`/`Write` e o Bash dele só roda lint/test/build e git de leitura | Um verificador que ajusta o teste até passar esconde exatamente a regressão que deveria achar. Na prova com erro plantado ele apontou a causa e devolveu a correção, sem tocar em nada | [.claude/agents/verificador-spec.md](.claude/agents/verificador-spec.md) (`disallowedTools`, texto), [.claude/hooks/verificador-bash-guard.mjs](.claude/hooks/verificador-bash-guard.mjs) | `f150799` |
| Briefing dados iniciais, item 3: "TI-0004 e TI-0007 em manutenção; os outros 10 disponíveis" | Lista da prática ("use exatamente esta, dados iguais para todos"), que marca também `TI-0010` como manutenção | 3 em manutenção (`TI-0004`, `TI-0007`, `TI-0010`), 9 disponíveis | A lista é declarada fonte comum da turma; o briefing a resume errado | spec dados-iniciais, tabela de decisões, linha "Situação" | `74f191d` |
| Briefing dados iniciais, item 5: "deixe a senha escrita no próprio arquivo que popula os dados" | Regra da prática ("nenhuma senha… em código ou no histórico do git") e [rules/secrets.md](rules/secrets.md) | Senha lida de `PROFESSOR_INITIAL_PASSWORD` (`apps/api/.env`); sem ela o seed para antes de gravar (CA-7) | Senha de conta real não vai para o git, nem "para facilitar" | spec dados-iniciais, linha "Senha"; [.env.example](.env.example) seção 3c | `74f191d`, `077c7a3` |
| Briefing dados iniciais (versão original), item 4: "instale a biblioteca sharp e redimensione depois do download" | Contrato da skill (800×600 garantido antes do envio, não depois) e [rules/restrictions.md](rules/restrictions.md) (dependência nativa) | `jimp` só na ferramenta `packages/equipment-images`; recorte antes do upload | Ver ADR 003: sem binário nativo, mesmo comportamento em Windows/CI | [docs/adr/003-processamento-de-imagens.md](docs/adr/003-processamento-de-imagens.md); spec dados-iniciais, linha "Tamanho das fotos" | `8e81f1c` |
| Usuário, durante a Entrega 2: "Pode enviar as fotos você mesmo" | Regra da prática ("o agente nunca escreve em produção") e requisito "Produção" da skill | O agente recusou; o upload foi rodado pelo usuário no terminal dele | O hook e o `assertHumanRun()` existem justamente para que um pedido no calor do momento não abra a exceção | [docs/handoff.md](docs/handoff.md) ("Upload feito pelo usuário"); [.claude/hooks/guard-image-upload.mjs](.claude/hooks/guard-image-upload.mjs) | `b9189ec`, `7807974` |
| Usuário, Entrega 3: "pode deletar todas as tabelas que não são do empresta.ai" | Mesma regra: escrita destrutiva e irreversível em produção | O agente contou as linhas (só leitura) e entregou o SQL; o usuário rodou | Plano free sem backup; apagar 74 linhas de outros sistemas é decisão e ação de quem é dono | spec dados-iniciais, "Fora de escopo" (limpeza feita pelo usuário) | `74f191d` |
| Briefing solicitar empréstimo, item 4: "Quem já tem 5 empréstimos em aberto não pode solicitar outro" | [PRD](docs/PRD.md): "no máximo 3 itens ao mesmo tempo" | Limite 3, lido de `tenants.loan_limit` | Regra de negócio é do PRD | spec solicitar-emprestimo, linha "Limite de itens" | `584ad3c`, `952d44b` |
| Briefing solicitar, item 3: "14 dias úteis" | PRD: "prazo padrão de devolução é de 14 dias" | 14 dias corridos, sem ajuste de fim de semana | PRD; dia útil exigiria calendário de feriados que nenhum documento define | spec solicitar-emprestimo, linha "Prazo" | `584ad3c`, `952d44b` |
| Briefing solicitar, item 9: "catálogo limpo… sem rodapé nem texto de crédito" | Contrato da biblioteca (CA-7, "Fotos: Pixabay" sempre), condições do Pixabay e a conferência final da própria prática (seção 07) | Recusado: o catálogo usa `EquipmentPhotoArea`, que mostra o crédito | Remover quebraria um contrato verificado e os termos de uso da API | spec solicitar-emprestimo, linha "Crédito das fotos" | `584ad3c` |
| [LAYOUT.md](docs/LAYOUT.md) §6: navegação por "troca de tela, sem rotas" | [ADR 001](docs/adr/001-stack.md) §2.2: React Router com proteção por sessão | React Router: `/`, `/entrar`, `/inicio`, `/catalogo`, `/meus-emprestimos` | Decisão técnica é do ADR; LAYOUT continua referência visual | spec login, linha "Navegação" | `76daa83` |
| LAYOUT §5.1: botão "Entrar como Operações →" | Autenticação real (ADR 001 §2.7): o papel vem do vínculo | Removido | Escolher o papel na tela seria escolher a própria permissão | spec login, linha "Botão Entrar como Operações" | `76daa83` |
| LAYOUT §5.2: card mostra "Com {pessoa} · devolver até {data}" | PRD item 1: "cada pessoa vê os próprios empréstimos" | Item de outra pessoa aparece só como "Emprestado", sem nome nem prazo; a API nem devolve esses campos (CA-1) | Privacidade definida pelo PRD vale sobre o protótipo | spec solicitar-emprestimo, linha "Item com outra pessoa" | `584ad3c`, `952d44b` |
| LAYOUT §6: Operações tem a aba "Meus empréstimos" | PRD: quem pede emprestado é o Colaborador | Só `EMPLOYEE` solicita; Operações vê o catálogo só para consulta, sem a aba | Leitura estrita do PRD (decisão do usuário) | spec solicitar-emprestimo, linha "Quem solicita"; spec login, CA-2 | `584ad3c`, `d22d67d` |
| ADR 001 §2.6: tenant "extraído da claim validada do JWT" | O token do Supabase não traz tenant | A API acha o vínculo pelo `sub` validado; tenant nunca vem do cliente | Ver seção 3 | spec login, linha "Origem do tenant" | `76daa83`, `aed95d6` |

## 1b. Lacunas: o que foi pedido de forma incompleta

| spec | o que faltava | alternativas | o que decidiu | por quê | commit |
|------|---------------|--------------|---------------|---------|--------|
| (skill, Entrega 2) | Como garantir "sem pessoa, marca, texto ou tela" em 12 fotos | Revisar todas à mão · só filtro automático · filtro + revisão por amostragem | Filtro por tags (`BLOCKED_TAGS`, tag obrigatória da categoria) + revisão humana por amostragem em `out/revisao.html` | O usuário não tinha como revisar tudo; o filtro corta o grosso e a revisão pega o que a tag não diz | `8e81f1c`, `83b67b3` |
| dados-iniciais | Papel do professor | Colaborador · Operações | `EMPLOYEE` em `suporte_ti`, "Marcelo Grilo" | A Entrega 4 testa o fluxo do colaborador | `74f191d` |
| dados-iniciais | Como guardar a foto no banco | URL completa · caminho no bucket · nada | Coluna `image_path` com CHECK no mesmo formato que a biblioteca aceita | A biblioteca recebe caminho, nunca URL (CA-1/CA-3 da biblioteca) | `077c7a3` |
| dados-iniciais | O que a re-execução faz com item existente | Sobrescrever tudo · não tocar · atualizar só dados cadastrais | Atualiza nome, categoria e foto; **não** a situação; conta existente não tem a senha trocada | Depois da carga a situação é de Operações; trocar senha apagaria a troca feita pela pessoa | `077c7a3` |
| dados-iniciais | Quem roda em produção e como o agente é impedido | Só instrução · hook · hook + recusa no código | Hook sobre o texto do comando + `prisma.config.ts` e seed recusando com `CLAUDECODE` contra banco não local; risco residual aceito (agente que remove `CLAUDECODE` de propósito) | Três rodadas do verificador acharam brechas no hook baseado em texto (seção 6) | `90677dd` |
| dados-iniciais | Tempo de transação do seed contra o banco remoto | Padrão do Prisma (2 s/5 s) · limites maiores · sem transação | 30 s para conectar, 2 min de transação | A 1ª execução em produção falhou sem gravar nada; teste com latência simulada reproduz | `5ba78cd` |
| login | O que é a "tela inicial" antes do catálogo existir | Só nome e Sair · barra completa | Barra completa por papel + boas-vindas | A Entrega 4 trocou só o conteúdo | `76daa83` |
| login | Mensagem para credencial errada | Mensagens diferentes · uma só | "E-mail ou senha incorretos." para os dois casos | Não revelar quais e-mails têm conta | `76daa83` |
| solicitar-emprestimo | Prazo que cai no fim de semana | Corridos sem ajuste · empurrar para dia útil | Sem ajuste | PRD diz 14 dias; ajuste seria regra nova | `584ad3c` |
| solicitar-emprestimo | Confirmação antes de criar | Um clique · modal | Modal com "Devolver até"; Confirmar cria na hora | "Na hora" é sem aprovação de terceiros; o modal evita empréstimo por clique acidental | `584ad3c` |
| solicitar-emprestimo | Busca e filtros (LAYOUT §7.8–7.9) | Fora · dentro | Dentro (CA-11) | Decisão do usuário | `584ad3c` |
| solicitar-emprestimo | "Hoje" para prazo e atraso | Relógio do Node · banco | `(now() AT TIME ZONE 'America/Sao_Paulo')::date` no banco | A Vercel roda em UTC; uma fonte só de "hoje" | `952d44b` |
| solicitar-emprestimo | Corrida de pedidos da mesma pessoa a itens diferentes | Trigger · `SERIALIZABLE` · lock no vínculo | `SELECT … FOR UPDATE` no vínculo dentro da transação | Já previsto em [modelagem-dados.md](docs/modelagem-dados.md); conferido: sem o lock, o teste do CA-4 falhou 3 de 3 vezes | `952d44b` |

## 2. Onde o agente tentou decidir por você

**Abas de Operações mudadas por fora do CA (agente decidiu e o verificador pegou).**
Ao implementar a Entrega 4, o agente tirou "Meus empréstimos" da barra de
Operações e registrou isso só numa linha nova da tabela de decisões da spec
login. O CA-2 continuava dizendo "abas do papel conforme LAYOUT §6" (quatro
abas). Como a seção de CA não mudou, o hash dos CA ficou igual e a mudança
de comportamento passaria sem nova verificação de verdade. O verificador
reprovou: rodada `20261110T202611Z-952d44b` (NÃO PRONTA, CA-2 AMBÍGUO, commit
`2893b28`), dizendo que "considerar que a decisão vale mais que o CA seria uma
interpretação minha". Corrigido escrevendo as abas no próprio CA-2, com a spec
voltando a `aprovada` até a nova rodada (`d22d67d`, PRONTA em `8f21ca5`), e
virou regra (seção 7).

**Tenant pelo vínculo em vez da claim do JWT (agente propôs um desvio de ADR).**
O ADR 001 §2.6 manda extrair o tenant de uma claim do token. O token do
Supabase não traz tenant. O agente decidiu buscá-lo pelo vínculo do `sub`
validado e, em vez de seguir calado, pôs isso na tabela de decisões da spec
login e, ao pedir a aprovação, destacou que essa era uma decisão tomada por
ele e que precisava da atenção do usuário. O usuário aprovou a spec com o
desvio; a decisão sobre ADR está na seção 3.

**Onde o agente poderia ter seguido o briefing e parou.** O briefing de dados
iniciais mandava escrever a senha no arquivo do seed, listava 2 itens em
manutenção (a lista da prática tem 3) e pedia `sharp`. Seguir qualquer um
seria "obedecer ao pedido"; o agente levantou os três na entrevista e o
usuário decidiu (seção 1). O mesmo vale para os dois pedidos do próprio
usuário de o agente escrever em produção (upload das fotos e limpeza de
tabelas): recusados, com o comando entregue para o usuário rodar.

## 3. Uma decisão que merece (ou não) um ADR

**Origem do tenant: vínculo do usuário, não claim do JWT.**

- Alternativa defensável: configurar um *Custom Access Token Hook* no
  Supabase que grava `tenant_id` no token, como o ADR 001 §2.6 descreve.
- Escolha: a API resolve o vínculo pelo `sub` verificado
  ([apps/api/src/auth/membership.ts](apps/api/src/auth/membership.ts)) e
  recusa conta sem vínculo ou com mais de um (403, CA-7 do login). O tenant
  continua nunca vindo do cliente (CA-8 do login, CA-5 da Entrega 4).
- Não virou ADR novo. Com um tenant só, o hook no Supabase seria
  configuração de produção extra (que o agente nem pode fazer) para
  resolver um problema que ainda não existe, e a troca é barata: um único
  ponto do código decide o tenant. A decisão está registrada onde ela vale,
  na spec login, com o gatilho para revisitar ("quando houver o segundo
  tenant").
- O que ficou errado: o ADR 001 §2.6 continua dizendo o contrário do que o
  código faz. Uma revisão do ADR 001 (como as já registradas no topo dele)
  é o lugar certo para essa decisão quando o segundo tenant chegar — ou
  antes, se alguém ler o ADR como verdade. Listado na seção 8.

## 4. A skill imagens-equipamentos

- **SKILL.md, references/ e script.**
  [SKILL.md](.claude/skills/imagens-equipamentos/SKILL.md) tem só o fluxo
  (preparar, revisar, reprovar, enviar), quem faz cada passo e o que o
  agente não pode fazer. [references/contrato.md](.claude/skills/imagens-equipamentos/references/contrato.md)
  mapeia cada requisito para quem o garante, e
  [references/pixabay.md](.claude/skills/imagens-equipamentos/references/pixabay.md)
  guarda o que a documentação da API diz (tamanhos de `webformatURL` e
  `largeImageURL`, proibição de hotlink, cache de 24 h). Tudo que precisa ser
  garantido virou código testado em `packages/equipment-images/src`.
  Critério: instrução no SKILL.md é para o que depende de julgamento ou de
  quem pode agir; o que dá para checar mecanicamente não fica em texto.
- **Código × instrução × pessoa** (detalhe em contrato.md): fonte única,
  800×600 exato (recorte ao centro, recusa origem menor, upload relê e
  recusa tamanho diferente), sem repetição, créditos completos e bucket sem
  duplicar são código com teste. "Direito de imagem" é código (filtro por
  tags) **mais** revisão humana por amostragem: as tags do Pixabay são
  escritas por quem publica, então nenhum filtro garante ausência de pessoa,
  marca ou texto. "Produção" é hook + código.
- **Como o agente não envia para produção:** o hook
  [guard-image-upload.mjs](.claude/hooks/guard-image-upload.mjs) nega o
  comando de upload; `assertHumanRun()` em `src/upload.mjs` recusa rodar com
  `CLAUDECODE`; e a chave `service_role` só existe em `apps/api/.env`, que as
  rules proíbem o agente de ler.
- **Fotos reprovadas: 2** ([rejeicoes.json](packages/equipment-images/rejeicoes.json), `83b67b3`):
  `TI-0001` (fora do tema: xícara e caderno; a tag `notebook` enganou o
  filtro) e `TI-0005` (tela com código e página web). O filtro foi
  endurecido (notebook exige tag `laptop`, marcas de câmera, retro/coffee).
  O agente também apontou risco em `TI-0004` (mãos de pessoa), `TI-0007`
  (texto e etiqueta de marca), `TI-0012` (logo) e nas substitutas de
  `TI-0001`/`TI-0005`; o usuário decidiu mantê-las. Ver seção 8.

## 4b. A biblioteca de renderização

- **Onde vive:** [apps/web/src/lib/equipment-photo](apps/web/src/lib/equipment-photo),
  exportando só `EquipmentPhotoArea` e `EquipmentPhoto`. Nenhuma tela monta
  foto por conta própria porque: (1) só a biblioteca transforma caminho em
  URL do bucket (`photoPublicUrl`); (2) `EquipmentPhoto` fora de uma área
  não renderiza nada (CA-8); (3) um teste varre todo `apps/web/src` atrás de
  referência ao bucket ou a `storage/v1/object` fora da lib (CA-9,
  [single-path.test.ts](apps/web/src/lib/equipment-photo/single-path.test.ts)).
  O catálogo da Entrega 4 é a primeira tela com fotos e passou por isso
  (rodada `20261110T202538Z-952d44b`).
- **Biblioteca × Storage:** o Storage garante o arquivo (exatamente 800×600,
  a skill recusa enviar outro tamanho); a biblioteca garante a apresentação
  (caixa 4:3, `object-fit: cover`, `width`/`height` 800×600, substituto,
  `alt`, crédito, só origem do bucket). Se o Storage falhasse e chegasse uma
  foto 1280×720, a tela continuaria 4:3 sem distorcer, mas o corte mudaria
  de foto para foto. Se a biblioteca falhasse, a foto apareceria no tamanho
  natural, quebrando a grade, sem crédito e aceitando qualquer URL.
- **Testes por requisito:** CA-1 e CA-3 em
  [storage.test.ts](apps/web/src/lib/equipment-photo/storage.test.ts);
  CA-1 a CA-6 e CA-8 em
  [EquipmentPhoto.test.tsx](apps/web/src/lib/equipment-photo/EquipmentPhoto.test.tsx);
  CA-7 em [EquipmentPhotoArea.test.tsx](apps/web/src/lib/equipment-photo/EquipmentPhotoArea.test.tsx);
  CA-9 em single-path.test.ts. Limite conhecido: o jsdom não aplica CSS, então
  a proporção na tela é provada pelas classes, não medida.

## 5. O subagente verificador

- **Gatilho:** hook de `Stop` do agente principal
  ([require-spec-verification.mjs](.claude/hooks/require-spec-verification.mjs)):
  com todas as tarefas do `tasks.md` marcadas e sem registro válido para o
  código atual, o agente não consegue encerrar o turno. Escolhido porque
  "tarefas concluídas" é o momento em que alguém declararia a spec pronta;
  rodar a cada commit seria caro e ruidoso, e só no CI chegaria tarde e sem
  tabela. Reforços: a trava de status (`Status: implementada` só com
  registro PRONTA válido, [guard-spec-files.mjs](.claude/hooks/guard-spec-files.mjs))
  e o CI repetindo a checagem no PR
  ([spec-verification.yml](.github/workflows/spec-verification.yml)).
- **O que lê:** AGENTS.md, rules, handoff, spec/plan/tasks e o código do
  intervalo pedido, e roda lint/test/build. Não herda a conversa
  ([verificador-spec.md](.claude/agents/verificador-spec.md)): herdar traria
  as justificativas do agente principal, e o valor do verificador é olhar só
  o que está escrito e o que roda.
- **O que não consegue fazer, e como:** sem `Edit`/`Write` (`disallowedTools`);
  Bash filtrado por [verificador-bash-guard.mjs](.claude/hooks/verificador-bash-guard.mjs)
  (só `turbo run lint|test|build` e git de leitura); não migra nem semeia
  produção ([guard-production-db.mjs](.claude/hooks/guard-production-db.mjs) +
  `assertSafePrismaCommand` em `prisma.config.ts`); não publica (não há
  comando de deploy liberado). O registro não é escrito pelo modelo: o hook
  [verificador-record.mjs](.claude/hooks/verificador-record.mjs)
  (`SubagentStop`) grava em `docs/specs/<spec>/verificacoes/` com commit,
  árvore limpa, hash dos CA, escopo, modelo e veredito, e nenhum agente
  consegue escrever nessa pasta. Todos os hooks ficam em
  `.claude/settings.json`: no frontmatter do subagente eles não rodaram
  (`4071865`).
- **Comparável:** cada registro tem o mesmo cabeçalho e a mesma tabela por
  CA, então duas rodadas da mesma spec são comparáveis lado a lado (ex.:
  `20261110T233406Z-1c0e3e9.md` × `20261110T233645Z-cc0df12.md`).
- **Monorepo web + api:** a verificação usa `turbo run … --filter=...[<base>]`,
  que pega os workspaces afetados dos dois lados. A validade é por spec: o
  `plan.md` declara `Escopo de código:` e só mudança ali invalida o
  registro (`8189ec1`). Por isso o commit do catálogo (`952d44b`) exigiu
  verificar de novo login e biblioteca, além da própria spec.

## 6. O verificador em ação

**Histórico real (rodadas que reprovaram algo):**

| spec | rodada | CA | causa | correção |
|------|--------|----|-------|----------|
| dados-iniciais | `077c7a3` (PRONTA com ressalva) | CA-8 | Um `DIRECT_URL` local em qualquer ponto do comando liberava migration de produção | `a3776db` |
| dados-iniciais | `a3776db` — NÃO PRONTA | CA-8 (e CA-1 a CA-7 sem execução) | Hook ainda liberava `$env:DIRECT_URL=…; migrate deploy` pelo Bash, atribuição dupla e subcomando entre aspas; e o guard do verificador lia o `package.json` do diretório errado, então ele não conseguiu rodar os checks | `45d2738` |
| dados-iniciais | `45d2738` — NÃO PRONTA | CA-8 | Expansão de shell (`migrate de${X}ploy`) e `git rebase --exec "… db:deploy"`; migrate sem segunda camada | `90677dd` (recusa também em `prisma.config.ts`, já com o shell expandido) |
| dados-iniciais | rodada 4 | — | Registro perdido: o hook gravava antes de o relatório chegar ao transcript | `e7a8c5a`; rodada 5 PRONTA |
| login | `952d44b` — NÃO PRONTA | CA-2 | Comportamento mudado por fora do CA (seção 2) | `d22d67d`; PRONTA em `8f21ca5` |

**Prova com erro plantado** (spec dados-iniciais):

- Plantado em `1c0e3e9`: [run.ts:40](apps/api/prisma/seed/run.ts) passou de
  `status: e.status` para `status: "AVAILABLE"` — todo equipamento nasceria
  disponível e `TI-0004/7/10` ficariam solicitáveis. Nenhum teste mudou.
- Tabela que voltou (`docs/specs/dados-iniciais/verificacoes/20261110T233406Z-1c0e3e9.md`, commit `bf3029b`):
  **NÃO PRONTA**. CA-2 REPROVADO: "O teste está vermelho em seed.spec.ts:162:
  esperava ["TI-0004","TI-0007","TI-0010"] em MAINTENANCE e recebeu []. Causa:
  apps/api/prisma/seed/run.ts:40 grava `status: "AVAILABLE"` fixo… Correção (é
  do agente principal): voltar para `status: e.status`." CA-1, CA-3 a CA-8
  ATENDIDOS. Ele também observou que a conferência de produção (CA-9) deixaria
  de valer para aquele código.
- Desfeito em `cc0df12` (`git revert` de `1c0e3e9`; diff do escopo contra
  `aed95d6` vazio). Rodada seguinte
  (`20261110T233645Z-cc0df12.md`): **PRONTA**, "o motivo da reprovação do
  CA-2 em 1c0e3e9 foi corrigido em cc0df12".
- Limites: a mensagem do commit plantado dizia que o erro era de propósito; o
  verificador registrou que "o veredito vem do teste, não da mensagem", mas
  uma prova cega pediria mensagem neutra. E ele achou uma lacuna real: o
  teste do CA-6 passa com o bug; só o CA-2 o pega.

**Tabela final — dados-iniciais** (`20261110T233645Z-cc0df12.md`, PRONTA):

| CA | evidência | status |
|----|-----------|--------|
| CA-1 | seed.spec.ts:123, :144 (inclusive latência simulada) | ATENDIDO |
| CA-2 | seed.spec.ts:159 | ATENDIDO |
| CA-3 | seed.spec.ts:166 (CHECK recusa 5 caminhos inválidos) | ATENDIDO |
| CA-4 | seed.spec.ts:185 | ATENDIDO |
| CA-5 | seed.spec.ts:192 (Auth em memória) | ATENDIDO |
| CA-6 | seed.spec.ts:210 (com a lacuna acima) | ATENDIDO |
| CA-7 | seed.spec.ts:226 | ATENDIDO |
| CA-8 | guard.spec.ts:28, :40, :51, :84 | ATENDIDO |
| CA-9 | manual, registrado em docs/handoff.md | NÃO AUTOMATIZÁVEL — conferido só leitura em produção (12 itens, situações, `image_path`, 0 empréstimos, conta do professor, 12 URLs 200); falta o login com a senha **[após o deploy]** |

**Tabela final — solicitar-emprestimo** (`20261110T202606Z-952d44b.md`, PRONTA):

| CA | evidência | status |
|----|-----------|--------|
| CA-1 | loans.spec.ts:86, :109 | ATENDIDO |
| CA-2 | loans.spec.ts:119, :138 | ATENDIDO |
| CA-3 | loans.spec.ts:148 | ATENDIDO |
| CA-4 | loans.spec.ts:178, :190 (requisições reais em paralelo) | ATENDIDO |
| CA-5 | loans.spec.ts:203 | ATENDIDO |
| CA-6 | loans.spec.ts:227 | ATENDIDO |
| CA-7 | catalog.test.tsx:19; loanRules.test.ts:28 | ATENDIDO |
| CA-8 | catalog.test.tsx:50, :61; loanRules.test.ts:17-19 | ATENDIDO |
| CA-9 | catalog.test.tsx:76, :98, :122 | ATENDIDO |
| CA-10 | catalog.test.tsx:134; loanRules.test.ts:20-21 | ATENDIDO |
| CA-11 | catalog.test.tsx:147 | ATENDIDO |
| CA-12 | catalog.test.tsx:177, :197 | ATENDIDO |
| CA-13 | manual em produção | NÃO AUTOMATIZÁVEL — **[após o deploy]** |

## 7. Uma regra sua que esta prática pôs à prova

**A regra de validade da verificação** (AGENTS.md, "Verificação de specs").

- Primeira versão: qualquer mudança de código no repositório invalidava todo
  registro. Ajustar o filtro de tags da skill derrubou o PRONTA da
  biblioteca e quebrou o CI de specs, sem nada ter mudado na biblioteca.
  Mudança: cada `plan.md` declara `Escopo de código:` e só mudança ali
  invalida o registro daquela spec (`8189ec1`).
- Segunda falha, no sentido oposto: a regra olhava o hash do texto dos CA.
  Uma decisão registrada fora da seção de CA mudou o comportamento exigido
  sem mudar o hash (seção 2). O verificador pegou porque leu a spec inteira,
  mas a regra deixava passar. Mudança: AGENTS.md e o template de spec agora
  exigem que decisão que muda o que um CA exige seja escrita no próprio CA,
  com a spec voltando a `aprovada` até nova verificação (commit desta
  entrega).
- Também posto à prova: hooks declarados no frontmatter do subagente não
  rodaram numa rodada real; todos foram para `.claude/settings.json` (`4071865`).

## 8. O que ficou de fora e o que faria diferente

**[após o deploy]** Conferência em produção (seção 07 do enunciado): login
do professor com a senha padrão, CA-10 do login, CA-13 da Entrega 4 e a parte
pendente do CA-9 dos dados iniciais. Depende de: variáveis nos dois projetos
Vercel, conta de teste própria e as branches na `main`.

Ficou de fora, sabendo:

- **Fotos com marca/pessoa mantidas.** O contrato da skill pede nenhuma foto
  com pessoa, marca ou logo legível; o usuário manteve `TI-0004`, `TI-0007`,
  `TI-0012` e as substitutas de `TI-0001`/`TI-0005` depois de o agente apontar
  o risco. O contrato não está cumprido nesses itens: é risco aceito, não
  garantia.
- **Risco residual do CA-8 (dados-iniciais):** um agente que remova
  `CLAUDECODE` do próprio ambiente de propósito escapa das duas camadas; a
  credencial de produção continua em `apps/api/.env`. Tirar a credencial do
  repositório foi oferecido e recusado.
- **ADR 001 §2.6 desatualizado** em relação à origem do tenant (seção 3).
- **Lacunas de teste apontadas pelo verificador e não corrigidas:** o teste
  do CA-6 (dados-iniciais) não pega primeira carga com situação errada;
  `authSettingsFromEnv` (emissor e JWKS a partir de `SUPABASE_URL`) só é
  exercitada em produção; falha de rede no "Sair" passa calada.
- **Partes do ADR 001 ainda não feitas:** `packages/api-contract` com orval
  (o tipo da API está escrito à mão no front), shadcn/ui, lint na API,
  `AsyncLocalStorage`.
- **Ruído do gatilho:** o hook de `Stop` bloqueia o encerramento enquanto o
  verificador ainda roda em segundo plano, porque não sabe que há
  verificação em curso.

Faria diferente:

- Escreveria no CA, desde o início, toda decisão que atravessa specs, em vez
  de confiar na tabela de decisões (a regra nova da seção 7).
- Na prova com erro plantado, usaria uma mensagem de commit neutra, para o
  verificador não saber de antemão.
- Teria insistido em deixar a credencial de produção fora do repositório
  local, o que fecharia o risco residual do CA-8 em vez de aceitá-lo.
