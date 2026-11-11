#!/usr/bin/env node
// Entry point for the imagens-equipamentos skill.
//   prepare [TI-0001 ...]    search, filter, crop to 800x600, record credits
//   reject <TI-XXXX> <motivo> record a human rejection and drop the photo
//   review                   write out/revisao.html
//   upload                   send to Supabase Storage (human only)

import fs from 'node:fs/promises';
import { loadCredits, loadRejections, outPathFor, saveCredits, saveRejections } from './manifest.mjs';
import { prepare } from './prepare.mjs';
import { writeReview } from './review.mjs';
import { upload } from './upload.mjs';

const [command, ...args] = process.argv.slice(2);

async function reject(patrimonio, ...reasonParts) {
  const motivo = reasonParts.join(' ').trim();
  if (!/^TI-\d{4}$/.test(patrimonio ?? '') || !motivo) {
    throw new Error('uso: images:reject TI-0001 "motivo da reprovação"');
  }
  const credits = await loadCredits();
  const credit = credits.find((c) => c.patrimonio === patrimonio);
  if (!credit) throw new Error(`${patrimonio} não tem foto preparada`);
  const rejections = await loadRejections();
  rejections.push({
    patrimonio,
    pixabayId: credit.pixabayId,
    pagina: credit.pagina,
    motivo,
    reprovadaEm: new Date().toISOString(),
  });
  await saveRejections(rejections);
  await saveCredits(credits.filter((c) => c.patrimonio !== patrimonio));
  await fs.rm(outPathFor(patrimonio), { force: true });
  console.log(`${patrimonio}: foto ${credit.pixabayId} reprovada. Rode images:prepare para escolher outra.`);
}

try {
  if (command === 'prepare') {
    const { failures } = await prepare({ only: args, key: process.env.PIXABAY_API_KEY });
    console.log(`folha de revisão: ${await writeReview()}`);
    if (failures.length) {
      console.error(`sem foto: ${failures.join(', ')}`);
      process.exitCode = 1;
    }
  } else if (command === 'reject') {
    await reject(...args);
  } else if (command === 'review') {
    console.log(`folha de revisão: ${await writeReview()}`);
  } else if (command === 'upload') {
    await upload();
  } else {
    console.error('comandos: prepare [TI-XXXX ...] | reject <TI-XXXX> <motivo> | review | upload');
    process.exitCode = 2;
  }
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
