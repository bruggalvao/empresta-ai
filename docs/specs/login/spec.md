# Spec: Login

Status: implementada
Referências: [PRD.md](../../PRD.md) (item 1) · [LAYOUT.md](../../LAYOUT.md) §5.1 e §6 · [ADR 001](../../adr/001-stack.md) §2.2, §2.4, §2.6, §2.7, §2.8 · [ADR 002](../../adr/002-design-system.md) · spec [dados-iniciais](../dados-iniciais/spec.md) · briefing da prática ("entra pelo login do sistema")

## Problema

Ninguém consegue entrar no sistema: a landing tem o botão "Entrar"
desabilitado e não existe tela de login nem forma de a interface saber
quem é a pessoa. Sem isso, o professor não entra no link da Vercel e a
Entrega 4 (solicitar empréstimo) não tem quem solicita.

## Quem usa

- Colaborador e Operações, ao abrir o sistema.
- O professor (`marcelo.grilo@institutojef.org.br`, colaborador de
  `suporte_ti`, criado pela spec dados-iniciais), na correção.

## Comportamento esperado

- Dado que estou na landing, quando clico em "Entrar", então vou para a
  tela de login.
- Dado que estou na tela de login, quando informo e-mail e senha de uma
  conta com acesso, então entro e vejo a tela inicial com meu nome, meu
  papel e as abas do meu papel.
- Dado que erro o e-mail ou a senha, quando clico em "Entrar", então vejo
  uma mensagem que não diz qual dos dois está errado, e o e-mail continua
  preenchido.
- Dado que minha conta existe mas não tem vínculo com nenhum tenant, quando
  entro, então vejo que ainda não tenho acesso e a sessão é encerrada.
- Dado que entrei, quando recarrego a página ou volto depois, então
  continuo dentro, até clicar em "Sair".
- Dado que não entrei, quando abro a tela inicial pelo endereço, então sou
  levado ao login.

## Regras de negócio envolvidas

Nenhuma regra de empréstimo do PRD é tocada. Regras que esta spec aplica:

- PRD item 1: login; cada pessoa só vê o que é dela (aqui: só os próprios
  dados de perfil e vínculo).
- ADR 001 §2.7: Supabase Auth com e-mail e senha; cadastro fechado; sessão
  no cliente pelo `supabase-js`, enviada à API como Bearer; a API valida o
  token pelas chaves públicas (JWKS) do Supabase.
- ADR 001 §2.6: tenant e usuário nunca vêm do corpo, da query nem de
  cabeçalho escolhido pelo cliente.
- Papel exibido: `EMPLOYEE` → "Colaborador"; `OPERATIONS` → "Operações".
  Abas por papel conforme LAYOUT §6.

### Decisões (conflitos e lacunas)

| ponto | fonte | decisão | por quê |
|---|---|---|---|
| Botão "Entrar como Operações →" | LAYOUT §5.1 | Removido: um único "Entrar"; o papel vem do vínculo da conta | No protótipo o botão escolhia o papel; com autenticação real, escolher o papel na tela seria escolher a própria permissão. Decisão do usuário |
| Navegação | LAYOUT §6 ("troca de tela, sem rotas") × ADR 001 §2.2 (React Router com proteção por sessão) | React Router: `/` landing, `/entrar` login, `/inicio` protegida | Decisão técnica é do ADR; LAYOUT segue como referência visual. Recarregar a página não perde a tela. Decisão do usuário |
| Dados da pessoa logada | ADR 001 §2.4 e §2.7 (front não lê o banco) | `GET /v1/me` na API, com o token validado pelo JWKS | Nome, papel e tenant estão em `profiles` e `memberships`; o guard de autenticação fica pronto para a Entrega 4. Decisão do usuário |
| Origem do tenant | ADR 001 §2.6 ("extraído da claim validada do JWT") | O token do Supabase não traz tenant. A API acha o vínculo pelo `sub` do token validado; continua nunca aceitando tenant vindo do cliente. Na v1 cada conta tem exatamente um vínculo; com mais de um, a API recusa | Colocar o tenant no token exige um *Custom Access Token Hook* configurado no projeto Supabase de produção, que não é necessário com um tenant só. Revisitar quando houver o segundo tenant |
| Tela inicial | briefing ("login, tela inicial") × catálogo só na Entrega 4 | `/inicio` com a barra de navegação completa (marca, abas do papel, etiqueta do papel, avatar com iniciais, nome, "Sair") e um conteúdo curto de boas-vindas. Abas de telas que ainda não existem aparecem desabilitadas | A Entrega 4 troca o conteúdo pelo catálogo sem refazer a barra. Decisão do usuário |
| Mensagem de erro de login | não diz | Uma só, "E-mail ou senha incorretos.", para e-mail inexistente e senha errada | Não revelar quais e-mails têm conta |
| Conta do professor nos testes | regra da prática ("para os seus testes, use outra conta") | Testes automáticos usam contas falsas locais. Em produção, o usuário testa com uma conta de teste própria; a conta do professor só é usada para conferir que o login entra, o que não cria empréstimo | Entrar não altera empréstimos; a conta precisa chegar à correção com zero empréstimos |

## Critérios de aceite

Cada critério tem um ID fixo (`CA-1`, `CA-2`, ...), citado no nome do
teste que o prova. IDs não são renumerados: um CA removido deixa o número
vago. Mudar o texto desta seção invalida as verificações anteriores.

- [ ] CA-1: O botão "Entrar" da landing leva a `/entrar`, que mostra a tela de login do LAYOUT §5.1 sem o botão "Entrar como Operações": título "Entrar", campos E-mail e Senha e o botão "Entrar".
- [ ] CA-2: Com e-mail e senha de uma conta com vínculo, a pessoa vai para `/inicio`, que mostra seu nome, suas iniciais, a etiqueta do papel ("Colaborador" ou "Operações"), as abas do papel conforme LAYOUT §6 e o botão "Sair".
- [ ] CA-3: Com credenciais recusadas pelo Supabase Auth, a tela mostra "E-mail ou senha incorretos.", mantém o e-mail e limpa a senha. Com e-mail ou senha vazios, a tela diz o que falta e não chama o Auth.
- [ ] CA-4: Sem sessão, `/inicio` redireciona para `/entrar`; com sessão, `/entrar` redireciona para `/inicio`; recarregar `/inicio` com sessão mantém a pessoa dentro.
- [ ] CA-5: "Sair" encerra a sessão no Supabase Auth e leva a `/entrar`; depois disso, `/inicio` volta a redirecionar para `/entrar`.
- [ ] CA-6: `GET /v1/me` com token válido do Supabase devolve id, e-mail, nome, papel e tenant (slug e nome) do vínculo da conta. Sem token, com token expirado, com assinatura que não confere com o JWKS ou com emissor ou audiência de outro projeto, responde 401 no formato Problem Details (RFC 9457).
- [ ] CA-7: Para conta autenticada sem vínculo ou com mais de um, `GET /v1/me` responde 403 em Problem Details; a interface mostra "Sua conta ainda não tem acesso. Fale com Operações." e encerra a sessão.
- [ ] CA-8: Usuário e tenant de `GET /v1/me` vêm só do token validado: com dois tenants no banco, uma pessoa do tenant A recebe só os próprios dados, mesmo enviando na query, no corpo ou em cabeçalho o id de outra pessoa ou do tenant B.
- [ ] CA-9: A API só aceita chamadas do navegador vindas da origem do front configurada (CORS com allowlist) e aceita o cabeçalho `Authorization`.
- [ ] CA-10: Em produção, pelo link da Vercel, a conta de teste do usuário entra, vê o próprio nome e papel, recarrega sem sair e sai; o professor entra com a senha padrão e vê "Marcelo Grilo" e "Colaborador"; consulta somente leitura confirma que a conta do professor continua com zero empréstimos. (Verificação manual.)

## Fora de escopo

- Cadastro de conta e convite: cadastro é fechado (ADR 001 §2.7); contas
  são criadas fora da interface.
- "Esqueci minha senha" e troca de senha: dependem de e-mail transacional,
  não coberto pelo ADR 001 (§5).
- Conteúdo das abas (catálogo, meus empréstimos, Operações, equipamentos):
  Entrega 4 e specs seguintes.
- Tenant no token (*Custom Access Token Hook*) e conta com mais de um
  tenant — ver decisões.
- Layout para celular: LAYOUT e ADR 002 são desktop (1360–1440px).
- Criar a conta de teste do usuário em produção e cadastrar variáveis na
  Vercel: feitos pelo usuário, com os passos no plan.md.
