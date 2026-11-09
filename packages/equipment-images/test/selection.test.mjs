import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockedTag, evaluateHit, largeImageSize, parseTags, pickCandidate } from '../src/selection.mjs';

const item = { patrimonio: 'TI-0001', categoria: 'notebook' };
const hit = (over = {}) => ({
  id: 1,
  type: 'photo',
  tags: 'laptop, desk, office',
  imageWidth: 4000,
  imageHeight: 3000,
  largeImageURL: 'https://pixabay.com/get/x.jpg',
  pageURL: 'https://pixabay.com/photos/x-1/',
  user: 'someone',
  user_id: 9,
  ...over,
});

test('direito de imagem: tags de pessoa, marca ou texto descartam a foto', () => {
  for (const tags of ['laptop, woman', 'laptop, young man', 'laptop, apple', 'laptop, logo', 'laptop, code', 'laptop, social media']) {
    const r = evaluateHit(hit({ tags }), item);
    assert.equal(r.ok, false, tags);
    assert.match(r.reason, /tag proibida/);
  }
});

test('bloqueio por palavra inteira: "manhattan" não é "man"', () => {
  assert.equal(blockedTag(parseTags('laptop, manhattan, office')), null);
});

test('foto precisa ter tag da categoria do equipamento', () => {
  const r = evaluateHit(hit({ tags: 'television, living room' }), item);
  assert.equal(r.ok, false);
  assert.match(r.reason, /categoria/);
});

test('sem repetição: foto já usada em outro equipamento é descartada', () => {
  const r = evaluateHit(hit(), item, { usedIds: new Set([1]) });
  assert.deepEqual(r, { ok: false, reason: 'já usada em outro equipamento' });
});

test('foto reprovada na revisão nunca volta', () => {
  const r = evaluateHit(hit(), item, { rejectedIds: new Set([1]) });
  assert.deepEqual(r, { ok: false, reason: 'reprovada na revisão' });
});

test('largeImageURL menor que 800x600 é descartada', () => {
  // 4000x1500 -> large 1280x480: wide enough, too short.
  assert.deepEqual(largeImageSize(hit({ imageWidth: 4000, imageHeight: 1500 })), { width: 1280, height: 480 });
  assert.match(evaluateHit(hit({ imageWidth: 4000, imageHeight: 1500 }), item).reason, /pequena/);
});

test('escolhe a primeira aceitável na ordem da API e explica as descartadas', () => {
  const hits = [hit({ id: 1, tags: 'laptop, woman' }), hit({ id: 2 }), hit({ id: 3 })];
  const { hit: chosen, skipped } = pickCandidate(hits, item, {});
  assert.equal(chosen.id, 2);
  assert.equal(skipped.length, 1);
});
