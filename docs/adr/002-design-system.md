# ADR 002: Design System (Nocturne com marca EMPREST.AI)

- **Status:** Proposto
- **Data:** 2026-10-01
- **Decisores:** Time Técnico / Operações (empresta-ai)
- **Origem / Insumo:** [docs/LAYOUT.md](../LAYOUT.md)
- **Relacionado:** [ADR 001](001-stack.md) (seção 2.2, estilização e componentes)

---

## 1. Contexto e Problema

O ADR 001 definiu Tailwind CSS + shadcn/ui como base de estilização e citou "fidelidade total ao design Figma", mas não fixou a identidade visual. O protótipo do app foi entregue em [docs/LAYOUT.md](../LAYOUT.md) (v1), construído sobre o design system **Nocturne** — interface escura e densa, com acento usado como linha e brilho, nunca como preenchimento sólido — com acento e tipografia trocados pela marca EMPREST.AI.

Sem uma decisão explícita, cada tela tende a redefinir cores, espaçamentos e estados, e o protótipo (que aplica estilos inline) não pode ser portado como está para a stack adotada. É preciso registrar quais decisões visuais são normativas, onde elas vivem no código e como se relacionam com Tailwind/shadcn.

---

## 2. Decisão

### 2.1 Fonte de verdade

- **Tokens como CSS custom properties** em `:root`, definidos em um único arquivo de estilos global em `apps/web`. Todo valor visual vem de `var(--*)`; valores literais em componentes são proibidos, salvo os listados na seção 2.3.
- O tema do Tailwind é **mapeado para esses tokens** (`theme.extend` apontando para `var(--*)`), de modo que utilitários (`bg-surface`, `text-accent`, `rounded-lg`) e componentes shadcn/ui consumam a mesma fonte.
- [docs/LAYOUT.md](../LAYOUT.md) permanece como especificação de telas e comportamento; **este ADR é a referência normativa para tokens e regras**. Em conflito sobre token, regra ou componente base, vale o ADR.
- Os estilos inline do protótipo **não** são portados: o equivalente é expresso por utilitários Tailwind sobre os tokens.
- O Figma citado no ADR 001 deixa de ser a referência visual; a referência passa a ser LAYOUT.md + este ADR.

### 2.2 Tema e cores

Tema único **escuro**. Não há tema claro na v1.

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#161826` | fundo de toda página |
| `--color-surface` | `#232532` | cards, tabela, modal, inputs |
| `--color-text` | `#e9e9ed` | texto principal |
| `--color-divider` | `color-mix(in srgb, #e9e9ed 16%, transparent)` | bordas e réguas |
| `--color-neutral-900` | `#292b31` | avatares neutros |

**Acento (teal da marca)**, rampa `--color-accent-100…900`:

```
100 #e6faf7 · 200 #c2f1eb · 300 #93e3da · 400 #5fcfc4
500 #2fb8ac (base) · 600 #26978e · 700 #1d746d · 800 #15534e · 900 #0f3733
```

- 500: bordas, linhas, ícones e números de destaque.
- 300: texto em tamanho de parágrafo sobre o fundo escuro (contraste).
- 900: preenchimentos tintados (avatar do usuário, toast); 700 para as bordas desses preenchimentos.
- Tints por transparência: `rgba(47,184,172,0.10)` chip de filtro ativo, `0.12` hover do primário e pill "Disponível", `0.22` pressed.

**Cores semânticas de situação** (pills, bordas, prazos), expostas como tokens `--status-<estado>-fg|bg|bd`:

| Estado | `fg` | `bg` | `bd` |
|---|---|---|---|
| Disponível / Em dia | `#5fcfc4` | `rgba(47,184,172,0.12)` | `rgba(47,184,172,0.40)` |
| Emprestado / a vencer | `#c9a25f` | `rgba(201,162,95,0.12)` | `rgba(201,162,95,0.38)` |
| Em atraso / erro | `#e88b8b` | `rgba(200,90,90,0.14)` | `rgba(200,90,90,0.40)` |
| Em manutenção / inativo | `#9aa0ad` | `rgba(154,160,173,0.10)` | `rgba(154,160,173,0.30)` |

Banner de bloqueio por atraso: borda `#7a3b3b`, fundo `rgba(122,59,59,0.14)`, texto `#e88b8b`.

**Texto secundário** é sempre `--color-text` com opacidade, nunca um cinza novo: 72% apoio em painéis · 70% labels · 62% corpo de diálogo · 55% subtítulos e metadados · 45% kickers e patrimônio · 40% rodapés.

**Regras de cor**
- Nunca preto puro nem branco puro.
- Nunca inundar áreas grandes com o acento; o botão primário é **contorno** de 1px sobre fundo transparente.
- Cromia baixa fora do acento: superfícies e bordas vêm dos neutros.
- A situação nunca é comunicada só por cor: o pill sempre traz o rótulo textual.

### 2.3 Tipografia

- Família única **Raleway** (400/500/600/700), em `--font-heading` e `--font-body`, carregada via Google Fonts.
- Títulos: peso 600, `line-height` ≈ 1.12, `letter-spacing: -0.015em`, `text-wrap: pretty`. Corpo: peso 400, `line-height` 1.55.
- Escala:

| Elemento | Tamanho |
|---|---|
| H1 do login | 44px |
| H1 de tela interna, número de KPI | 30px |
| H2 "Entrar" | 26px |
| Título de modal | 20px |
| Título de painel/seção | 17px |
| Título de card | 16.5px |
| Nome de item em lista | 16px |
| Subtítulo de página, lead | 14–16px |
| Corpo, célula, input, botão | 13.5–14px |
| Nota, metadado, chip | 12–13px |
| Kicker / cabeçalho de tabela | 11–11.5px, `letter-spacing` 0.08–0.09em, caixa alta |
| Micro-rótulo | 11–12px |

- Marca: `EMPREST` peso 700 + `.AI` no acento, `letter-spacing: 0.02em` (17px no login, 15px na navbar).

### 2.4 Espaçamento, raios e elevação

- Escala de espaçamento (densidade 0.70×): `2.8 · 5.6 · 8.4 · 11.2 · 16.8 · 22.4px`. Valores fora dela só onde LAYOUT.md os especifica para um componente (ex.: padding 18px do card).
- Raios: `--radius-sm 4px`, `--radius-md 8px` (botões, inputs, linhas de lista), `--radius-lg 14px` (cards, painéis, modal), `999px` para pills e traços.
- Elevação: `--shadow-sm/md/lg`; nunca sombras empilhadas.
- Espaçamento entre irmãos **sempre** por `gap` em flex/grid, nunca por margem de elemento.
- Alturas de controles: input/select/botão 36px; botão do login 40px; avatar 28px (26px na tabela); pill 3px/9px de padding.
- Medidas de layout (larguras máximas por tela, navbar de 60px, modal de 420px, grades) seguem LAYOUT.md seção 3 e não são tokens globais.

### 2.5 Componentes base

Os componentes base são implementados com **shadcn/ui** (copiados para `apps/web`) e restilizados pelos tokens acima, mantendo as variantes do Nocturne:

| Componente | Variantes / regras |
|---|---|
| Button | `primary` (contorno acento), `secondary` (contorno divider), `ghost` (texto acento), `block`; tamanho padrão 36px |
| Tag | `outline`, para papel/seção |
| Card | com `kicker` e `title`; elevações `sm/md/lg` |
| Field / Input | label + input, inclui `select` e `textarea` |
| Radio | com indicador `dot` |
| Nav | barra sticky de 60px, aba ativa com `border-bottom: 2px` no acento |
| Table | cabeçalho com fundo `text 5%`, linhas separadas por borda superior de 1px |
| Dialog | backdrop `rgba(10,11,18,0.68)`; clique fora fecha |
| Toast | pill fixa na base, cores `accent-900/700/200`, some após 2600ms |
| StatusPill | recebe o estado e deriva fg/bg/bd dos tokens semânticos |
| Brand | marca quadrada com borda 1.5px do acento e quadradinho central |
| SectionRule | régua com gradiente que desaparece nas pontas |

Estados: hover tintado do acento; pressed um passo além; foco `outline: 2px solid var(--color-accent); outline-offset: 2px`; desabilitado `opacity .45` + `cursor: not-allowed`. Ícones: Phosphor Icons.

A cor, o rótulo e a habilitação de cada botão e pill são **derivados no render** a partir do estado de domínio; não ficam em estado próprio da UI.

### 2.6 Movimento

Discreto e curto. Única animação nomeada: `fadeUp` (opacidade + `translateY(6px)`), em cards do catálogo (.25s), modal (.18s) e toast (.2s). Sem escala, sombra pulsante, parallax, nem animação em KPIs, tabelas ou navegação. Respeitar `prefers-reduced-motion` desabilitando o `fadeUp`.

### 2.7 Conteúdo e idioma

Interface em PT-BR; datas em `DD/MM/AAAA`; tom direto e operacional, sem exclamações e sem emoji. Consistente com AGENTS.md (UI em PT-BR, código em inglês).

### 2.8 Governança

- Cor, tamanho, raio ou sombra novos exigem **adicionar um token** (e atualizar este ADR), não um valor literal no componente.
- Um componente base novo só entra se não puder ser composto com os existentes.
- Mudanças que alterem regras desta seção são registradas como revisão neste ADR.

---

## 3. Alternativas Descartadas

| Alternativa | Motivo do Descarte |
|---|---|
| Portar o protótipo com estilos inline | Valores duplicados por elemento, sem tema central; incompatível com Tailwind/shadcn adotados no ADR 001. |
| Biblioteca de componentes opinionated (MUI, Mantine) | Já descartada no ADR 001; conflita com a identidade densa e escura do Nocturne. |
| Tema claro + escuro na v1 | Dobra a superfície de tokens e de verificação de contraste sem requisito que o justifique. |
| Acento como preenchimento sólido em botões | Contraria a regra central do Nocturne (acento como linha e brilho) e satura telas densas. |
| Cinzas próprios para texto secundário | Gera divergência entre superfícies; opacidade sobre `--color-text` mantém coerência automática. |
| Várias famílias tipográficas | Raleway única em 4 pesos cobre títulos e corpo e reduz carga de fontes. |
| CSS-in-JS / Design tokens via JS | Custo de runtime sem ganho sobre custom properties + Tailwind. |

---

## 4. Consequências

### Positivas
- Uma fonte única de tokens: trocar acento ou raio é uma alteração de um arquivo.
- shadcn/ui e utilitários Tailwind falam a mesma linguagem visual, sem estilos paralelos.
- Estados de situação consistentes em catálogo, tabela e modais, derivados de um mapa único.
- Regras de cor e movimento objetivas, verificáveis em revisão de PR.

### Negativas (Trade-offs e Desafios)
- **Tema único escuro:** usuários que preferem tema claro não são atendidos na v1.
- **Contraste a validar:** textos em 40–55% de opacidade e o acento 500 sobre `--color-bg` precisam de checagem WCAG; o ADR prescreve acento 300 para parágrafos, mas rótulos pequenos de baixa opacidade podem não atingir AA.
- **Dependência de fonte externa:** Raleway via Google Fonts exige permitir o domínio na CSP (ADR 001, seção 2.10) ou auto-hospedar a fonte.
- **Densidade 0.70×:** alvos de toque de 36px ficam abaixo do recomendado para mobile; o layout de referência é desktop (1360–1440px) e telas menores não estão especificadas.
- **Manutenção de dois documentos:** LAYOUT.md e este ADR precisam ficar alinhados; a regra de precedência (seção 2.1) mitiga mas não elimina.

### Limitações Futuras (Custos de Reversão)
- Tema claro exigirá segunda camada de tokens e revisão dos tints por transparência, hoje calibrados para fundo escuro.
- Trocar de família tipográfica ou de marca é barato nos tokens, mas pode reordenar quebras de linha em telas densas.

---

## 5. Itens Não Cobertos por este Registro

- Layout responsivo/mobile e breakpoints.
- Acessibilidade além das regras citadas (navegação por teclado, leitores de tela, auditoria de contraste).
- Biblioteca de ícones além da escolha do Phosphor e uso de ilustrações.
- Fluxos, regras de negócio e dados de exemplo das telas (permanecem em LAYOUT.md).
- Documentação interativa dos componentes (Storybook ou similar).
