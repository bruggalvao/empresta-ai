// upload: validated files -> public bucket in Supabase Storage. Run by a
// person in their own terminal, never by the agent (see assertHumanRun and
// .claude/hooks/guard-image-upload.mjs).

import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { BUCKET } from './config.mjs';
import { md5, readSize, sha256 } from './image.mjs';
import { loadCredits, loadEquipment, loadRejections, outPathFor, validateForUpload } from './manifest.mjs';

export function assertHumanRun(env = process.env) {
  if (env.CLAUDECODE) {
    throw new Error(
      'O upload para o Supabase não roda dentro de uma sessão de agente. ' +
        'Rode no seu terminal: pnpm --filter equipment-images images:upload',
    );
  }
}

export async function describeFiles(credits) {
  const files = {};
  for (const c of credits) {
    try {
      const buf = await fs.readFile(outPathFor(c.patrimonio));
      files[c.arquivo] = { sha256: sha256(buf), md5: md5(buf), ...(await readSize(buf)), buffer: buf };
    } catch {
      // missing file is reported by validateForUpload
    }
  }
  return files;
}

async function ensurePublicBucket(storage, log) {
  const { data, error } = await storage.getBucket(BUCKET);
  if (error && !/not found/i.test(error.message)) throw error;
  if (!data) {
    const { error: createError } = await storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ['image/jpeg'],
      fileSizeLimit: '1MB',
    });
    if (createError) throw createError;
    log(`bucket ${BUCKET} criado (público)`);
  } else if (!data.public) {
    const { error: updateError } = await storage.updateBucket(BUCKET, { public: true });
    if (updateError) throw updateError;
    log(`bucket ${BUCKET} tornado público`);
  }
}

export async function upload({ env = process.env, log = console.log } = {}) {
  assertHumanRun(env);
  const url = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar em apps/api/.env');

  const [equipment, credits, rejections] = await Promise.all([loadEquipment(), loadCredits(), loadRejections()]);
  const files = await describeFiles(credits);
  const problems = validateForUpload({ equipment, credits, rejections, files });
  if (problems.length) throw new Error(`nada foi enviado:\n- ${problems.join('\n- ')}`);

  const storage = createClient(url, serviceKey, { auth: { persistSession: false } }).storage;
  await ensurePublicBucket(storage, log);

  const { data: existing, error: listError } = await storage.from(BUCKET).list('', { limit: 1000 });
  if (listError) throw listError;
  const remote = new Map((existing ?? []).map((o) => [o.name, String(o.metadata?.eTag ?? '').replace(/"/g, '')]));

  let sent = 0;
  let unchanged = 0;
  for (const c of credits) {
    const file = files[c.arquivo];
    if (remote.get(c.arquivo) === file.md5) {
      unchanged++;
      continue;
    }
    // Fixed object name + upsert: re-running replaces, never duplicates.
    const { error } = await storage.from(BUCKET).upload(c.arquivo, file.buffer, {
      contentType: 'image/jpeg',
      upsert: true,
      cacheControl: '3600',
    });
    if (error) throw new Error(`${c.arquivo}: ${error.message}`);
    sent++;
  }

  const extras = [...remote.keys()].filter((name) => !credits.some((c) => c.arquivo === name));
  log(`enviadas: ${sent} · já iguais no bucket: ${unchanged}`);
  if (extras.length) log(`no bucket mas fora dos créditos (não apagados): ${extras.join(', ')}`);
  log(`exemplo: ${url}/storage/v1/object/public/${BUCKET}/${credits[0]?.arquivo}`);
}
