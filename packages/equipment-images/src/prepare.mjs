// prepare: Pixabay -> filter -> 800x600 JPEG in out/ + credits. Never
// touches Supabase. Re-running keeps every photo that is still valid.

import fs from 'node:fs/promises';
import { OUT_DIR, PIXABAY_LICENSE } from './config.mjs';
import { md5, sha256, toExactSize } from './image.mjs';
import { fileNameFor, loadCredits, loadEquipment, loadRejections, outPathFor, saveCredits } from './manifest.mjs';
import { download, searchPixabay } from './pixabay.mjs';
import { parseTags, pickCandidate } from './selection.mjs';

async function fileSha(file) {
  try {
    return sha256(await fs.readFile(file));
  } catch {
    return null;
  }
}

export async function prepare({ only = [], key, fetchImpl = fetch, log = console.log } = {}) {
  const equipment = await loadEquipment();
  const rejections = await loadRejections();
  const rejectedIds = new Set(rejections.map((r) => r.pixabayId));
  const credits = new Map((await loadCredits()).map((c) => [c.patrimonio, c]));
  await fs.mkdir(OUT_DIR, { recursive: true });

  const targets = only.length ? equipment.filter((e) => only.includes(e.patrimonio)) : equipment;
  const failures = [];

  for (const item of targets) {
    const current = credits.get(item.patrimonio);
    if (current && !rejectedIds.has(current.pixabayId) && (await fileSha(outPathFor(item.patrimonio))) === current.sha256) {
      log(`${item.patrimonio}: mantida (Pixabay ${current.pixabayId})`);
      continue;
    }

    const usedIds = new Set(
      [...credits.values()].filter((c) => c.patrimonio !== item.patrimonio).map((c) => c.pixabayId),
    );
    const hits = await searchPixabay(item.busca, { key, fetchImpl });
    const { hit, skipped } = pickCandidate(hits, item, { usedIds, rejectedIds });
    if (!hit) {
      failures.push(item.patrimonio);
      log(`${item.patrimonio}: nenhuma candidata aceitável entre ${hits.length} (${summarize(skipped)})`);
      continue;
    }

    const image = await toExactSize(await download(hit.largeImageURL, { fetchImpl }));
    await fs.writeFile(outPathFor(item.patrimonio), image);
    credits.set(item.patrimonio, {
      patrimonio: item.patrimonio,
      nome: item.nome,
      arquivo: fileNameFor(item.patrimonio),
      busca: item.busca,
      pixabayId: hit.id,
      pagina: hit.pageURL,
      autor: hit.user,
      autorPerfil: `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
      licenca: PIXABAY_LICENSE.nome,
      licencaUrl: PIXABAY_LICENSE.url,
      tags: parseTags(hit.tags),
      sha256: sha256(image),
      md5: md5(image),
      largura: 800,
      altura: 600,
      preparadaEm: new Date().toISOString(),
    });
    log(`${item.patrimonio}: Pixabay ${hit.id} de ${hit.user} (${skipped.length} descartada(s) antes)`);
  }

  await saveCredits([...credits.values()]);
  return { failures };
}

function summarize(skipped) {
  const counts = {};
  for (const s of skipped) counts[s.reason.split(':')[0]] = (counts[s.reason.split(':')[0]] ?? 0) + 1;
  return Object.entries(counts).map(([r, n]) => `${n} ${r}`).join(', ') || 'busca vazia';
}
