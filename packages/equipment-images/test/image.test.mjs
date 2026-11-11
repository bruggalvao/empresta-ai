import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Jimp } from 'jimp';
import { readSize, toExactSize } from '../src/image.mjs';

const jpeg = (width, height) => new Jimp({ width, height, color: 0x336699ff }).getBuffer('image/jpeg');

test('800x600 garantido: paisagem 16:9 vira exatamente 800x600', async () => {
  assert.deepEqual(await readSize(await toExactSize(await jpeg(1280, 720))), { width: 800, height: 600 });
});

test('800x600 garantido: retrato vira exatamente 800x600', async () => {
  assert.deepEqual(await readSize(await toExactSize(await jpeg(900, 1200))), { width: 800, height: 600 });
});

test('origem menor que 800x600 é recusada (recortada, nunca esticada)', async () => {
  await assert.rejects(toExactSize(await jpeg(700, 500)), /menor que 800×600/);
});
