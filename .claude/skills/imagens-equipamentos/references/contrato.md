# Contrato da skill e quem garante cada requisito

Fonte do contrato: Entrega 2 da prática (`pratica-sdd-subagentes.html`).
"Código" = o requisito é imposto por código e coberto por teste em
`packages/equipment-images/test/`. "Pessoa" = depende de alguém olhar.

| requisito | como é garantido | quem garante |
|---|---|---|
| **Fonte**: só Pixabay | `download()` recusa URL fora de `https://pixabay.com/`; a busca só chama a API do Pixabay | código (`pixabay.test.mjs`) |
| **Direito de imagem**: sem pessoa, marca/logo, texto ou tela com conteúdo | `safesearch`, só `photo`, tags proibidas (`BLOCKED_TAGS`, palavra inteira) e tag obrigatória da categoria descartam candidatas | código (`selection.test.mjs`) + **pessoa, por amostragem** em `out/revisao.html`. Tags do Pixabay são escritas por quem publica: uma foto sem a tag `person` pode ter uma pessoa. O risco residual é aceito e registrado no ENTREGA.md |
| **800×600 no Storage** | `toExactSize()` recorta ao centro para 4:3 e reduz; recusa origem menor (não estica) e confere o resultado; o upload relê cada arquivo e recusa qualquer tamanho diferente | código (`image.test.mjs`, `upload.test.mjs`) |
| **Sem repetição** | `prepare` exclui fotos já usadas por outro equipamento; o upload recusa `pixabayId` repetido | código (`selection.test.mjs`, `upload.test.mjs`) |
| **Créditos** | `creditos.json` (versionado): página no Pixabay, autor e perfil, licença, termo de busca, hash do arquivo; o upload recusa crédito incompleto ou arquivo diferente do registrado | código (`upload.test.mjs`) |
| **Armazenamento**: bucket público, sem duplicar | bucket `equipamentos` criado/tornado público pelo upload; nome fixo `<patrimônio>.jpg` + `upsert`; arquivo igual (md5 = eTag) não é reenviado; nada é servido de URL do Pixabay | código + biblioteca de renderização (CA-1, CA-3) |
| **Produção**: agente prepara, não envia | hook `.claude/hooks/guard-image-upload.mjs` nega o comando; `assertHumanRun()` recusa com `CLAUDECODE`; a chave `service_role` está em `.env`, que o agente não lê | hook + código (`upload.test.mjs`) |
| **Segredos e dependências** | `PIXABAY_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` só em `apps/api/.env`, carregados pelo `--env-file-if-exists` do script; a chave não entra no cache; dependências: `jimp` ([ADR 003](../../../../docs/adr/003-processamento-de-imagens.md)) e `@supabase/supabase-js` (ADR 001) | código (`pixabay.test.mjs`) + ADR |
| **Crédito na tela** | responsabilidade da biblioteca de renderização (spec `biblioteca-renderizacao`, CA-7) | código da biblioteca |
