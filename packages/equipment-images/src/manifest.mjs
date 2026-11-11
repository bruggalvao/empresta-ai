// Credits manifest (creditos.json) and rejections (rejeicoes.json): both
// committed, both the evidence of where each photo came from.

import fs from 'node:fs/promises';
import path from 'node:path';
import { CREDITS_FILE, EQUIPMENT_FILE, HEIGHT, OUT_DIR, REJECTIONS_FILE, WIDTH } from './config.mjs';

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    throw err;
  }
}

async function writeJson(file, data) {
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export const loadEquipment = () => readJson(EQUIPMENT_FILE, []);
export const loadCredits = () => readJson(CREDITS_FILE, []);
export const loadRejections = () => readJson(REJECTIONS_FILE, []);

export const saveCredits = (credits) =>
  writeJson(CREDITS_FILE, [...credits].sort((a, b) => a.patrimonio.localeCompare(b.patrimonio)));
export const saveRejections = (rejections) => writeJson(REJECTIONS_FILE, rejections);

export const fileNameFor = (patrimonio) => `${patrimonio}.jpg`;
export const outPathFor = (patrimonio, outDir = OUT_DIR) => path.join(outDir, fileNameFor(patrimonio));

// Everything that must hold before anything goes to Storage. Returns a list
// of problems; empty means ready. `files` maps file name -> { sha256, width, height } | undefined.
export function validateForUpload({ equipment, credits, rejections, files }) {
  const problems = [];
  const rejectedIds = new Set(rejections.map((r) => r.pixabayId));
  const byAsset = new Map(credits.map((c) => [c.patrimonio, c]));
  const seenIds = new Map();

  for (const item of equipment) {
    const credit = byAsset.get(item.patrimonio);
    if (!credit) {
      problems.push(`${item.patrimonio}: sem foto preparada`);
      continue;
    }
    for (const field of ['pixabayId', 'pagina', 'autor', 'licenca', 'arquivo', 'sha256']) {
      if (!credit[field]) problems.push(`${item.patrimonio}: crédito sem ${field}`);
    }
    if (credit.arquivo !== fileNameFor(item.patrimonio)) {
      problems.push(`${item.patrimonio}: arquivo ${credit.arquivo} fora do padrão ${fileNameFor(item.patrimonio)}`);
    }
    if (rejectedIds.has(credit.pixabayId)) {
      problems.push(`${item.patrimonio}: foto ${credit.pixabayId} foi reprovada na revisão`);
    }
    if (seenIds.has(credit.pixabayId)) {
      problems.push(`${item.patrimonio}: foto ${credit.pixabayId} repetida (também em ${seenIds.get(credit.pixabayId)})`);
    }
    seenIds.set(credit.pixabayId, item.patrimonio);

    const file = files[credit.arquivo];
    if (!file) {
      problems.push(`${item.patrimonio}: arquivo ${credit.arquivo} não encontrado em out/`);
      continue;
    }
    if (file.sha256 !== credit.sha256) problems.push(`${item.patrimonio}: arquivo diferente do registrado nos créditos`);
    if (file.width !== WIDTH || file.height !== HEIGHT) {
      problems.push(`${item.patrimonio}: ${file.width}×${file.height}, esperado ${WIDTH}×${HEIGHT}`);
    }
  }

  const known = new Set(equipment.map((e) => e.patrimonio));
  for (const credit of credits) {
    if (!known.has(credit.patrimonio)) problems.push(`${credit.patrimonio}: crédito de equipamento fora da lista`);
  }
  return problems;
}
