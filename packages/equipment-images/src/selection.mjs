// Pure rules that decide whether a Pixabay hit may become an equipment photo.

import { BLOCKED_TAGS, CATEGORY_TAGS, HEIGHT, PIXABAY_LARGE_MAX, WIDTH } from './config.mjs';

export function parseTags(tags) {
  return String(tags ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

// Whole-word match: "man" blocks "man" and "young man", not "manhattan".
function tagMatches(tag, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(tag);
}

export function blockedTag(tags, blocked = BLOCKED_TAGS) {
  for (const tag of tags) {
    for (const term of blocked) {
      if (tagMatches(tag, term)) return term;
    }
  }
  return null;
}

export function hasCategoryTag(tags, category) {
  const wanted = CATEGORY_TAGS[category] ?? [];
  return tags.some((tag) => wanted.some((term) => tagMatches(tag, term)));
}

// Size of largeImageURL, derived from the original size (max 1280 on the
// longest side, never upscaled).
export function largeImageSize(hit) {
  const w = Number(hit.imageWidth);
  const h = Number(hit.imageHeight);
  const scale = Math.min(1, PIXABAY_LARGE_MAX / Math.max(w, h));
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

export function evaluateHit(hit, item, { usedIds = new Set(), rejectedIds = new Set() } = {}) {
  const tags = parseTags(hit.tags);
  if (rejectedIds.has(hit.id)) return { ok: false, reason: 'reprovada na revisão' };
  if (usedIds.has(hit.id)) return { ok: false, reason: 'já usada em outro equipamento' };
  if (hit.type && hit.type !== 'photo') return { ok: false, reason: `tipo ${hit.type}` };
  const blocked = blockedTag(tags);
  if (blocked) return { ok: false, reason: `tag proibida: ${blocked}` };
  if (!hasCategoryTag(tags, item.categoria)) return { ok: false, reason: `sem tag da categoria ${item.categoria}` };
  const large = largeImageSize(hit);
  if (large.width < WIDTH || large.height < HEIGHT) {
    return { ok: false, reason: `pequena demais (${large.width}×${large.height})` };
  }
  if (!hit.largeImageURL || !hit.pageURL) return { ok: false, reason: 'resposta sem URL' };
  return { ok: true, reason: null };
}

// First acceptable hit in API order, plus why the others were skipped.
export function pickCandidate(hits, item, ctx) {
  const skipped = [];
  for (const hit of hits) {
    const { ok, reason } = evaluateHit(hit, item, ctx);
    if (ok) return { hit, skipped };
    skipped.push({ id: hit.id, reason });
  }
  return { hit: null, skipped };
}
