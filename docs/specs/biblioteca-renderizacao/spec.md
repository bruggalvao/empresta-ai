# Spec: Biblioteca de renderização de fotos de equipamento

Status: aprovada
Referências: [PRD.md](../../PRD.md)#o-que-precisa-existir-na-primeira-versao (item 2: catálogo) · [LAYOUT.md](../../LAYOUT.md) · [ADR 001](../../adr/001-stack.md) §2.2 e §2.8 · [ADR 002](../../adr/002-design-system.md) · contrato da Entrega 2 da prática

## Problema

As fotos de equipamento vão chegar ao Storage pela skill
`imagens-equipamentos`, já em 800×600. Sem um caminho único para
exibi-las, cada tela decidiria sozinha tamanho, origem, o que fazer sem
foto e onde pôr o crédito "Fotos: Pixabay" — e bastaria uma tela esquecer
para o sistema distorcer foto, exibir imagem de fora ou ficar sem crédito.

## Quem usa

- Colaborador e Operações, indiretamente: toda tela que mostra
  equipamento com foto (catálogo, meus empréstimos, tela de Operações).
- Quem desenvolve essas telas: usa a biblioteca em vez de montar a imagem.

## Comportamento esperado

A biblioteca vive em `apps/web/src/lib/equipment-photo/` e expõe duas
peças: a **área de fotos**, que envolve qualquer trecho de tela com fotos
de equipamento e sempre mostra o crédito, e a **foto**, que recebe o
caminho do arquivo no bucket e o nome do equipamento.

- Dado um equipamento com caminho de foto válido no bucket, quando a
  tela o exibe, então a foto aparece a partir do bucket público do
  Storage do projeto, em 4:3, ocupando a largura disponível.
- Dado um equipamento sem foto, quando a tela o exibe, então aparece um
  substituto padronizado, do mesmo tamanho da foto, sem quebrar o layout.
- Dado um caminho que não é de um arquivo do bucket (URL completa,
  inclusive do Pixabay, ou caminho com `/` ou `..`), quando a tela o
  exibe, então nenhuma imagem é carregada e aparece o substituto.
- Dada uma foto que falha ao carregar, então ela é trocada pelo
  substituto.
- Dada uma tela com fotos, então o crédito "Fotos: Pixabay" com link
  para o Pixabay aparece junto delas, sem que a tela precise colocá-lo.
- Dada uma foto usada fora da área de fotos, então ela não é exibida
  (e o console de desenvolvimento avisa), porque ali não haveria crédito.

## Regras de negócio envolvidas

Nenhuma regra do PRD é alterada. Regras novas, vindas do contrato da
prática e das condições de uso da API do Pixabay:

- Foto de equipamento só vem do bucket público `equipamentos` do Storage
  do projeto; nunca de URL do Pixabay ou de outra origem.
- Toda tela que exibe fotos mostra "Fotos: Pixabay" com link.

## Critérios de aceite

Cada critério tem um ID fixo (`CA-1`, `CA-2`, ...), citado no nome do
teste que o prova. IDs não são renumerados: um CA removido deixa o número
vago. Mudar o texto desta seção invalida as verificações anteriores.

- [ ] CA-1: Dado o caminho de um arquivo do bucket (ex.: `TI-0001.jpg`), a foto é carregada da URL pública `<VITE_SUPABASE_URL>/storage/v1/object/public/equipamentos/<caminho>`.
- [ ] CA-2: A foto é exibida em proporção 4:3, na largura do contêiner, sem distorção (`object-fit: cover`), com `width`/`height` 800×600 declarados.
- [ ] CA-3: Caminho inválido — URL absoluta (inclusive `pixabay.com`), caminho com `/`, `\` ou `..`, ou extensão que não seja `.jpg`, `.jpeg`, `.png` ou `.webp` — não gera nenhuma requisição de imagem e mostra o substituto.
- [ ] CA-4: Equipamento sem caminho de foto mostra o substituto padronizado, na mesma proporção 4:3.
- [ ] CA-5: Foto que dispara erro de carregamento é trocada pelo substituto.
- [ ] CA-6: A foto tem texto alternativo igual ao nome do equipamento; o substituto tem rótulo acessível "Sem foto: <nome>".
- [ ] CA-7: A área de fotos sempre exibe "Fotos: Pixabay" com link para `https://pixabay.com/`, abrindo em nova aba com `rel="noopener noreferrer"`.
- [ ] CA-8: Foto renderizada fora de uma área de fotos não exibe imagem nem substituto.
- [ ] CA-9: Nenhum arquivo de `apps/web/src` fora de `lib/equipment-photo/` referencia o bucket `equipamentos` nem monta URL de `storage/v1/object` (teste automatizado sobre o código-fonte).

## Fora de escopo

- Tela de catálogo e "meus empréstimos" — Entrega 4; elas serão as
  primeiras consumidoras da biblioteca.
- Coluna com o caminho da foto no banco e seed dos equipamentos —
  Entrega 3 (dados iniciais). A biblioteca recebe o caminho pronto.
- Obter, recortar e enviar as fotos — skill `imagens-equipamentos`.
- Imagens que não são de equipamento (landing, logo, ilustrações).
- Tamanhos responsivos (`srcset`) e transformação de imagem do Supabase:
  o Storage já guarda 800×600.
