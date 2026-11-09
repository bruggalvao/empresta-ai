# API do Pixabay — o que afeta este fluxo

Fonte: https://pixabay.com/api/docs/ (consultada em 2026-11-09). Confira
de novo antes de mudar o fluxo: termos e limites podem mudar.

- **Chave**: gratuita, por conta. Limite padrão de 100 requisições por 60
  segundos, contado por chave.
- **Cache obrigatório**: respostas de busca devem ficar em cache por 24h.
  O `prepare` guarda em `.cache/` (fora do git) e reaproveita.
- **Sem hotlink permanente**: as URLs devolvidas servem só para exibir
  resultado de busca temporariamente; para usar a imagem, baixe para o
  seu servidor. Por isso as fotos ficam no Storage e a biblioteca de
  renderização recusa URL do Pixabay.
- **Tamanhos devolvidos** (sem conta aprovada para acesso completo):
  `previewURL` até 150 px, `webformatURL` até 640 px — menor que 800×600,
  não serve —, `largeImageURL` até 1280 px no maior lado. O `prepare` usa
  `largeImageURL` e calcula o tamanho dela a partir de `imageWidth`/
  `imageHeight` antes de baixar. `fullHDURL` e `imageURL` exigem
  aprovação.
- **Atribuição**: o Pixabay pede que se mostre de onde vêm as imagens
  sempre que resultados são exibidos — atendido pelo crédito "Fotos:
  Pixabay" da biblioteca de renderização.
- **Licença**: Pixabay Content License
  (https://pixabay.com/service/license-summary/). Registrada em cada
  entrada de `creditos.json`.
- **Uso**: sem consultas automatizadas em massa nem download sistemático.
  12 equipamentos, com cache, ficam bem abaixo disso.
