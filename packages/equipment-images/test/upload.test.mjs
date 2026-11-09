import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateForUpload } from '../src/manifest.mjs';
import { assertHumanRun, checkSupabaseUrl } from '../src/upload.mjs';

test('SUPABASE_URL de projeto inexistente explica o problema em vez de "fetch failed"', async () => {
  const notFound = async () => {
    throw Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' });
  };
  await assert.rejects(checkSupabaseUrl('https://gkicttuoyjicaonzjoyp.supabase.co', notFound), /não foi encontrado \(ENOTFOUND\)/);
  await assert.rejects(checkSupabaseUrl('https://[PROJECT-REF].supabase.co'), /inválida|exemplo/);
  await assert.rejects(checkSupabaseUrl('http://abc.supabase.co'), /inválida/);
  await assert.doesNotReject(checkSupabaseUrl('https://abc.supabase.co', async () => ({ address: '1.2.3.4' })));
});

const equipment = [{ patrimonio: 'TI-0001' }, { patrimonio: 'TI-0002' }];
const credit = (patrimonio, pixabayId) => ({
  patrimonio,
  arquivo: `${patrimonio}.jpg`,
  pixabayId,
  pagina: `https://pixabay.com/photos/x-${pixabayId}/`,
  autor: 'someone',
  licenca: 'Pixabay Content License',
  sha256: `sha-${patrimonio}`,
});
const file = (patrimonio, over = {}) => ({ sha256: `sha-${patrimonio}`, width: 800, height: 600, ...over });
const ok = () => ({
  equipment,
  credits: [credit('TI-0001', 1), credit('TI-0002', 2)],
  rejections: [],
  files: { 'TI-0001.jpg': file('TI-0001'), 'TI-0002.jpg': file('TI-0002') },
});

test('tudo certo: nenhum problema', () => {
  assert.deepEqual(validateForUpload(ok()), []);
});

test('produção: upload se recusa a rodar dentro de sessão do agente', () => {
  assert.throws(() => assertHumanRun({ CLAUDECODE: '1' }), /não roda dentro de uma sessão de agente/);
  assert.doesNotThrow(() => assertHumanRun({}));
});

test('800x600: arquivo de outro tamanho bloqueia o upload', () => {
  const input = ok();
  input.files['TI-0002.jpg'] = file('TI-0002', { width: 801 });
  assert.match(validateForUpload(input).join('\n'), /TI-0002: 801×600/);
});

test('sem repetição: mesma foto em dois equipamentos bloqueia o upload', () => {
  const input = ok();
  input.credits[1] = credit('TI-0002', 1);
  assert.match(validateForUpload(input).join('\n'), /repetida/);
});

test('foto reprovada na revisão bloqueia o upload', () => {
  const input = ok();
  input.rejections = [{ pixabayId: 2 }];
  assert.match(validateForUpload(input).join('\n'), /reprovada/);
});

test('créditos: falta de autor ou de foto bloqueia o upload', () => {
  const input = ok();
  input.credits[0] = { ...credit('TI-0001', 1), autor: '' };
  input.credits.pop();
  const problems = validateForUpload(input).join('\n');
  assert.match(problems, /TI-0001: crédito sem autor/);
  assert.match(problems, /TI-0002: sem foto preparada/);
});

test('arquivo alterado depois de preparado bloqueia o upload', () => {
  const input = ok();
  input.files['TI-0001.jpg'] = file('TI-0001', { sha256: 'other' });
  assert.match(validateForUpload(input).join('\n'), /diferente do registrado/);
});
