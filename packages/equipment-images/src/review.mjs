// review: static contact sheet (out/revisao.html) for the human sample
// review. Rejections are recorded with `images:reject`, not on this page.

import fs from 'node:fs/promises';
import path from 'node:path';
import { OUT_DIR } from './config.mjs';
import { loadCredits } from './manifest.mjs';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function renderReview(credits) {
  const cards = credits
    .map(
      (c) => `<figure>
  <img src="${esc(c.arquivo)}" width="800" height="600" alt="${esc(c.nome)}">
  <figcaption><b>${esc(c.patrimonio)}</b> · ${esc(c.nome)}<br>
  Pixabay <a href="${esc(c.pagina)}">${esc(c.pixabayId)}</a> · ${esc(c.autor)}<br>
  <small>${esc(c.tags.join(', '))}</small><br>
  <code>pnpm --filter equipment-images images:reject ${esc(c.patrimonio)} "motivo"</code></figcaption>
</figure>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Revisão de fotos</title>
<style>
body{font-family:system-ui,sans-serif;background:#161826;color:#e9e9ed;margin:24px}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px}
figure{margin:0;background:#232532;border-radius:8px;overflow:hidden}
img{display:block;width:100%;height:auto;aspect-ratio:4/3}
figcaption{padding:10px 12px;font-size:14px;line-height:1.5}
a{color:#5fcfc4}code{font-size:12px;color:#c9a25f}
</style></head><body>
<h1>Revisão de fotos de equipamento</h1>
<p>Reprove qualquer foto com pessoa, marca ou logo legível, texto ou tela com conteúdo. Depois rode de novo <code>images:prepare</code>.</p>
<main>
${cards}
</main></body></html>
`;
}

export async function writeReview() {
  const credits = await loadCredits();
  const file = path.join(OUT_DIR, 'revisao.html');
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(file, renderReview(credits), 'utf8');
  return file;
}
