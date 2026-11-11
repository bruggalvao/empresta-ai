import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { download, searchPixabay } from '../src/pixabay.mjs';

const KEY = 'test-key-123';

function fakeFetch(hits) {
  const calls = [];
  const impl = async (url) => {
    calls.push(url);
    return { ok: true, json: async () => ({ hits }) };
  };
  return { impl, calls };
}

test('busca pede só foto, safesearch e tamanho mínimo 800x600', async () => {
  const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pxb-'));
  const { impl, calls } = fakeFetch([]);
  await searchPixabay('hdmi cable', { key: KEY, fetchImpl: impl, cacheDir });
  const params = new URL(calls[0]).searchParams;
  assert.equal(params.get('image_type'), 'photo');
  assert.equal(params.get('safesearch'), 'true');
  assert.equal(params.get('min_width'), '800');
  assert.equal(params.get('min_height'), '600');
});

test('resposta fica em cache por 24h e a chave não vai para o cache', async () => {
  const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pxb-'));
  const { impl, calls } = fakeFetch([{ id: 1 }]);
  const t0 = Date.parse('2026-11-09T10:00:00Z');
  await searchPixabay('webcam', { key: KEY, fetchImpl: impl, cacheDir, now: t0 });
  await searchPixabay('webcam', { key: KEY, fetchImpl: impl, cacheDir, now: t0 + 23 * 3600e3 });
  assert.equal(calls.length, 1, 'segunda busca dentro de 24h veio do cache');
  await searchPixabay('webcam', { key: KEY, fetchImpl: impl, cacheDir, now: t0 + 25 * 3600e3 });
  assert.equal(calls.length, 2, 'depois de 24h busca de novo');

  for (const f of await fs.readdir(cacheDir)) {
    assert.ok(!f.includes(KEY));
    assert.ok(!(await fs.readFile(path.join(cacheDir, f), 'utf8')).includes(KEY));
  }
});

test('fonte única: download fora do Pixabay é recusado', async () => {
  await assert.rejects(download('https://images.example.com/x.jpg', { fetchImpl: async () => ({}) }), /fora do Pixabay/);
});
