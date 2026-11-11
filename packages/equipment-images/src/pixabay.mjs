// Pixabay API client. Responses are cached on disk for 24h, as the API
// terms require; the API key never goes into the cache key or file.

import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CACHE_DIR, CACHE_TTL_MS, HEIGHT, PIXABAY_API, WIDTH } from './config.mjs';

export function searchParams(query) {
  return {
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    min_width: String(WIDTH),
    min_height: String(HEIGHT),
    order: 'popular',
    per_page: '100',
  };
}

function cacheFile(cacheDir, params) {
  const id = createHash('sha1').update(JSON.stringify(params)).digest('hex').slice(0, 16);
  return path.join(cacheDir, `search-${id}.json`);
}

export async function searchPixabay(
  query,
  { key, fetchImpl = fetch, cacheDir = CACHE_DIR, now = Date.now() } = {},
) {
  const params = searchParams(query);
  const file = cacheFile(cacheDir, params);
  try {
    const cached = JSON.parse(await fs.readFile(file, 'utf8'));
    if (now - cached.fetchedAt < CACHE_TTL_MS) return cached.hits;
  } catch {
    // no cache or unreadable cache: fetch
  }
  if (!key) throw new Error('PIXABAY_API_KEY ausente em apps/api/.env (ver .env.example, seção 3b)');
  const url = `${PIXABAY_API}?${new URLSearchParams({ key, ...params })}`;
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`Pixabay respondeu ${res.status} para "${query}"`);
  const body = await res.json();
  const hits = Array.isArray(body.hits) ? body.hits : [];
  await fs.mkdir(cacheDir, { recursive: true });
  await fs.writeFile(file, JSON.stringify({ query, params, fetchedAt: now, hits }), 'utf8');
  return hits;
}

export async function download(url, { fetchImpl = fetch } = {}) {
  if (!String(url).startsWith('https://pixabay.com/')) throw new Error(`origem fora do Pixabay: ${url}`);
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`download falhou (${res.status}): ${url}`);
  return Buffer.from(await res.arrayBuffer());
}
