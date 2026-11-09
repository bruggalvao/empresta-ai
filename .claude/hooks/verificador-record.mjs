#!/usr/bin/env node
// Stop hook in the verificador-spec frontmatter (runs as SubagentStop).
// Saves the verifier's final answer, stamped with the code state it refers to,
// into docs/specs/<feature>/verificacoes/<UTC timestamp>-<sha7>.md.
//
// The record is written by the harness, not by the model: the verifier has no
// write tools and the main agent is blocked from writing in verificacoes/.

import fs from 'node:fs';
import path from 'node:path';
import {
  criteriaHash,
  dirtyCodeFiles,
  featureFromSpecPath,
  headSha,
  normalizeVerdict,
  readStdinJson,
  recordsDir,
  repoRoot,
} from '../../scripts/spec-verification.mjs';

const input = await readStdinJson();
const message = String(input.last_assistant_message ?? '').replace(/\r\n/g, '\n');

function block(reason) {
  // Ask the verifier to fix its output format once; never loop.
  if (input.stop_hook_active) process.exit(0);
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
}

function notify(text) {
  process.stdout.write(JSON.stringify({ systemMessage: text }));
  process.exit(0);
}

// The verifier asked for missing input instead of verifying: nothing to record.
if (/^\s*Entrada incompleta:/i.test(message)) process.exit(0);

const specLine = /^\s*Spec:\s*`?([^`\s]+)`?\s*$/im.exec(message);
const verdictLine = /^\s*Veredito:\s*(.+)$/im.exec(message);
if (!specLine || !verdictLine) {
  block(
    'Resposta fora do formato: a primeira linha deve ser `Spec: docs/specs/<feature>/spec.md` ' +
      'e a última `Veredito: PRONTA | NÃO PRONTA — <motivo>`. Reescreva a resposta completa nesse formato, sem rodar nada de novo.',
  );
}

const root = repoRoot(input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
const specRel = specLine[1].replace(/\\/g, '/').replace(/^\.\//, '');
const feature = featureFromSpecPath(specRel);
const specAbs = path.join(root, specRel);
if (!feature || !fs.existsSync(specAbs)) {
  block(`A linha Spec aponta para um arquivo que não existe ou não é uma spec: ${specRel}. Corrija a linha Spec.`);
}

const verdict = normalizeVerdict(verdictLine[1]);
if (!verdict) block('A linha Veredito deve começar com PRONTA ou NÃO PRONTA.');

function modelFromTranscript(file) {
  try {
    const lines = fs.readFileSync(file, 'utf8').trim().split('\n').reverse();
    for (const line of lines) {
      const model = JSON.parse(line)?.message?.model;
      if (model) return model;
    }
  } catch {
    // best effort
  }
  return 'desconhecido';
}

const sha = headSha(root);
const dirty = dirtyCodeFiles(root);
const now = new Date();
const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const dir = recordsDir(root, feature);
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `${stamp}-${sha.slice(0, 7)}.md`);

const header = [
  `# Verificação — ${feature}`,
  '',
  `- Spec: ${specRel}`,
  `- Commit: ${sha}`,
  `- Árvore limpa: ${dirty.length ? `não (${dirty.length} arquivo(s) de código alterado(s); este registro não libera a spec)` : 'sim'}`,
  `- Hash dos CA: ${criteriaHash(fs.readFileSync(specAbs, 'utf8'))}`,
  `- Modelo: ${modelFromTranscript(input.agent_transcript_path)}`,
  `- Agent ID: ${input.agent_id ?? 'desconhecido'}`,
  `- Data: ${now.toISOString()}`,
  `- Veredito: ${verdict}`,
  '',
  ...(dirty.length ? ['Arquivos de código não commitados no momento da verificação:', '', ...dirty.map((l) => `    ${l}`), ''] : []),
  '## Resultado do verificador',
  '',
];

fs.writeFileSync(file, `${header.join('\n')}${message.trim()}\n`, 'utf8');
notify(`Verificação registrada em ${path.relative(root, file).replace(/\\/g, '/')} (${verdict}).`);
