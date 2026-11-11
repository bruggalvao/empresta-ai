#!/usr/bin/env node
// PreToolUse hook (project settings) for Edit|Write|MultiEdit|Bash.
//
// 1. Verification records (docs/specs/*/verificacoes/) are written only by the
//    verificador-spec SubagentStop hook. No tool may create, edit or delete them.
// 2. Status gate: spec.md can only become `Status: implementada` (or have its
//    acceptance criteria changed while implementada) when there is a current
//    verification record with verdict PRONTA.

import fs from 'node:fs';
import path from 'node:path';
import {
  criteriaHash,
  currentRecord,
  featureFromSpecPath,
  isImplemented,
  isRecordPath,
  readStdinJson,
  repoRoot,
  verifierInvocation,
} from '../../scripts/spec-verification.mjs';

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

const input = await readStdinJson();
const tool = input.tool_name;
const ti = input.tool_input ?? {};
const root = repoRoot(input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());

const RECORD_MSG =
  'Registros em docs/specs/*/verificacoes/ são gravados só pelo hook do verificador-spec e não podem ser criados, editados ou apagados por outra via. Para um novo registro, acione o verificador-spec.';

// --- Bash: best-effort protection against bypassing the file tools ---------
if (tool === 'Bash' || tool === 'PowerShell') {
  const cmd = String(ti.command ?? '');
  // A single git command whose only free text is a message (quoted or heredoc)
  // cannot write records itself; staging/committing them is expected.
  const skeleton = cmd
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*$/, '')
    .replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, '""')
    .trim();
  const isPlainGit =
    /^git\s+(?:add|commit|status|diff|log|show|ls-files|restore\s+--staged)\b/.test(skeleton) &&
    !/[;|<>`\n]|&&|\$\(/.test(skeleton);
  if (/verificacoes\b/.test(cmd) && !isPlainGit) deny(RECORD_MSG);
  if (/spec\.md/.test(cmd) && /implementada/i.test(cmd) && !isPlainGit) {
    deny('Mudança de status de spec só pela ferramenta Edit/Write, para passar pela trava do verificador-spec.');
  }
  process.exit(0);
}

// --- File tools -------------------------------------------------------------
const filePath = ti.file_path ?? ti.notebook_path;
if (!filePath) process.exit(0);
const abs = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
const rel = path.relative(root, abs).replace(/\\/g, '/');

if (isRecordPath(rel)) deny(RECORD_MSG);

const feature = featureFromSpecPath(rel);
if (!feature) process.exit(0);

const before = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';

function applyEdit(text, { old_string = '', new_string = '', replace_all = false }) {
  if (!old_string) return text;
  return replace_all ? text.split(old_string).join(new_string) : text.replace(old_string, () => new_string);
}

let after;
if (tool === 'Write') after = String(ti.content ?? '');
else if (tool === 'Edit') after = applyEdit(before, ti);
else if (tool === 'MultiEdit') after = (ti.edits ?? []).reduce(applyEdit, before);
else process.exit(0);

if (!isImplemented(after)) process.exit(0);
if (isImplemented(before) && criteriaHash(before) === criteriaHash(after)) process.exit(0);

const rec = currentRecord(root, feature, after);
if (!rec) {
  deny(
    `A spec ${feature} não pode ser marcada como implementada: não há registro do verificador-spec válido para o código atual ` +
      `(registro precisa ser de árvore limpa, com os mesmos CA e sem mudança de código depois). ${verifierInvocation(feature)}`,
  );
}
if (rec.verdict !== 'PRONTA') {
  deny(
    `A spec ${feature} não pode ser marcada como implementada: o último registro válido (${path
      .relative(root, rec.file)
      .replace(/\\/g, '/')}) tem veredito ${rec.verdict}. Corrija os CA reprovados e acione o verificador-spec de novo.`,
  );
}
process.exit(0);
