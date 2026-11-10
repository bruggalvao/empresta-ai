# Spec: Dados iniciais

Status: aprovada
Referências: [PRD.md](../../PRD.md) (itens 1 e 2) · [ADR 001](../../adr/001-stack.md) §2.5, §2.6, §2.7 · [ADR 003](../../adr/003-processamento-de-imagens.md) · [rules/migration.md](../../../rules/migration.md) · [rules/secrets.md](../../../rules/secrets.md) · spec [biblioteca-renderizacao](../biblioteca-renderizacao/spec.md) · briefing "dados iniciais" da prática

## Problema

O sistema em produção não tem equipamentos para mostrar nem a conta do
professor para testar. Sem esses dados, catálogo e empréstimo (Entrega 4)
não têm o que exibir nem quem solicitar.

## Quem usa

- O professor (`marcelo.grilo@institutojef.org.br`), que corrige a prática
  como colaborador.
- Indiretamente, todo colaborador: o catálogo mostra estes equipamentos.
- Quem implanta: roda a migration e o seed no banco de produção.

## Comportamento esperado

- Dado um banco com as migrations aplicadas, quando o seed roda, então o
  tenant `suporte_ti` passa a ter os 12 equipamentos da lista da prática,
  cada um com patrimônio, nome, categoria, situação e caminho da foto no
  bucket `equipamentos`, e nenhum empréstimo.
- Dado o mesmo banco, quando o seed roda, então a conta do professor
  existe no Supabase Auth com e-mail confirmado, entra com a senha padrão
  da turma, e é colaboradora do tenant `suporte_ti` com zero empréstimos.
- Dado que o seed já rodou, quando ele roda de novo, então nada é
  duplicado e a senha de uma conta já existente não é trocada.
- Dado que falta a senha padrão na configuração, ou que falta foto
  preparada para algum equipamento, quando o seed roda, então ele para com
  uma mensagem clara antes de gravar qualquer coisa.

## Regras de negócio envolvidas

Nenhuma regra do PRD é alterada. Dados fixos desta entrega:

- Lista de equipamentos: `packages/equipment-images/equipamentos.json`
  (a lista da prática, "dados iguais para todos").
- Categorias: notebook → `NOTEBOOK`, monitor → `MONITOR`, cabo → `CABLE`,
  câmera → `CAMERA`.
- Situação: `TI-0004`, `TI-0007` e `TI-0010` em manutenção; os outros 9
  disponíveis (decisão abaixo).
- Foto: o caminho registrado em `packages/equipment-images/creditos.json`
  (`<patrimônio>.jpg`), já em 800×600 no Storage.

### Decisões (conflitos e lacunas do briefing)

| ponto | briefing | decisão | por quê |
|---|---|---|---|
| Situação | "TI-0004 e TI-0007 em manutenção; os outros 10 disponíveis" | 3 em manutenção (inclui `TI-0010`), 9 disponíveis | A lista da prática marca `TI-0010` como manutenção e é declarada "dados iguais para todos"; decisão do usuário |
| Senha | "deixe a senha escrita no próprio arquivo que popula os dados" | Senha lida de `PROFESSOR_INITIAL_PASSWORD` (`apps/api/.env`); nunca no código nem no git | Regra da prática ("nenhuma senha... em código ou no histórico do git") e `rules/secrets.md` |
| Tamanho das fotos | "instale a biblioteca sharp e redimensione" | Nada é instalado: as fotos já estão no Storage em 800×600, feitas pela skill com jimp | ADR 003 e contrato da skill (Entrega 2) |
| Login | "entra pelo login do sistema" | Esta spec cria a conta; a tela de login é a spec `login`, logo depois | O repositório não tem tela de login; decisão do usuário |
| Imagem no banco | "cada equipamento tem imagem" | Coluna `image_path` opcional em `equipment`, com o mesmo formato que a biblioteca aceita | A biblioteca recebe caminho do bucket, não URL; decisão do usuário |
| Papel do professor | não diz | `EMPLOYEE` (colaborador) no tenant `suporte_ti`, nome "Marcelo Grilo" | A Entrega 4 testa o fluxo do colaborador; decisão do usuário |
| Re-execução | "não pode duplicar nada" | Equipamento existente tem nome, categoria e foto atualizados, mas **não** a situação; conta existente não tem a senha trocada | Situação passa a ser de Operações depois da carga; trocar senha em cada execução apagaria uma troca feita pela pessoa |
| Quem roda em produção | não diz | O usuário, no terminal dele; o agente é bloqueado (hook + recusa do seed) | Regra da prática: "o agente nunca escreve em produção" |
| Alcance do bloqueio (CA-8) | não diz | Duas camadas: o hook lê o texto do comando; `prisma.config.ts` e o seed recusam, já com o shell expandido, quando o agente (`CLAUDECODE`) aponta para banco ou Auth não locais. Isso cobre comando acidental e disfarce por sintaxe de shell. **Não** cobre um agente que remova `CLAUDECODE` do próprio ambiente de propósito: a credencial de produção continua no `apps/api/.env`. Risco aceito e registrado no ENTREGA.md | Decisão do usuário (2026-11-10), depois de três rodadas do verificador acharem brechas no hook baseado em texto; a alternativa (credencial de produção fora do repositório) foi oferecida e recusada |

## Critérios de aceite

Cada critério tem um ID fixo (`CA-1`, `CA-2`, ...), citado no nome do
teste que o prova. IDs não são renumerados: um CA removido deixa o número
vago. Mudar o texto desta seção invalida as verificações anteriores.

- [ ] CA-1: Após o seed, o tenant `suporte_ti` tem exatamente os 12 equipamentos da lista, com patrimônio, nome e categoria da lista (4 `NOTEBOOK`, 3 `MONITOR`, 3 `CABLE`, 2 `CAMERA`).
- [ ] CA-2: Após o seed, `TI-0004`, `TI-0007` e `TI-0010` estão em `MAINTENANCE` e os outros 9 em `AVAILABLE`.
- [ ] CA-3: Cada equipamento tem `image_path` igual ao arquivo registrado em `creditos.json` (`<patrimônio>.jpg`); o banco recusa `image_path` que não seja nome de arquivo simples com extensão `.jpg`, `.jpeg`, `.png` ou `.webp`.
- [ ] CA-4: O seed não cria empréstimo: após rodar, não há empréstimo no tenant e o professor tem zero empréstimos.
- [ ] CA-5: Após o seed, `marcelo.grilo@institutojef.org.br` existe no Supabase Auth com e-mail confirmado e a senha de `PROFESSOR_INITIAL_PASSWORD`, tem perfil "Marcelo Grilo" e é `EMPLOYEE` do tenant `suporte_ti`.
- [ ] CA-6: Rodar o seed duas vezes deixa o mesmo número de tenants, equipamentos, contas, perfis e vínculos, não troca a senha de conta existente e não altera a situação de equipamento existente.
- [ ] CA-7: Sem `PROFESSOR_INITIAL_PASSWORD`, ou com equipamento sem foto em `creditos.json`, o seed para com mensagem que diz o que falta e não grava nada.
- [ ] CA-8: O seed se recusa a rodar quando executado por agente (`CLAUDECODE` definido) contra banco que não seja local, e um hook nega ao agente os comandos de migration e seed de produção.
- [ ] CA-9: Em produção, depois que o usuário aplica a migration e roda o seed, uma consulta somente leitura no banco do deploy confirma CA-1, CA-2, CA-3, CA-4 e CA-5, e as 12 fotos abrem pela URL pública. (Verificação manual.)

## Fora de escopo

- Tela de login — spec `login`, logo depois desta.
- Tela de catálogo e solicitar empréstimo — Entrega 4.
- Cadastro de equipamento pela interface e importação da planilha (briefing).
- Obter, recortar ou reenviar fotos — skill `imagens-equipamentos`.
- Limpar tabelas de outros sistemas no projeto Supabase — feito pelo
  usuário à parte, fora do repositório.
