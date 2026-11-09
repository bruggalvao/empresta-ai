#!/usr/bin/env node
// Stop hook (main agent). If a spec has every task in tasks.md ticked, is not
// yet `Status: implementada`, and has no verification record for the current
// code, the agent cannot end its turn: it is told to run verificador-spec.
//
// Only the absence of a record blocks. A current NÃO PRONTA record lets the
// turn end (the failure was reported); the status gate still keeps the spec
// from being marked implementada.

import fs from 'node:fs';
import path from 'node:path';
import {
  SPECS_DIR,
  codeUnchangedSince,
  criteriaHash,
  isImplemented,
  listRecords,
  listSpecs,
  readStdinJson,
  repoRoot,
  tasksComplete,
  verifierInvocation,
} from '../../scripts/spec-verification.mjs';

const input = await readStdinJson();
if (input.stop_hook_active) process.exit(0);

const root = repoRoot(input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd());
const read = (rel) => {
  const p = path.join(root, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
};

const pending = [];
for (const feature of listSpecs(root)) {
  const spec = read(`${SPECS_DIR}/${feature}/spec.md`);
  const tasks = read(`${SPECS_DIR}/${feature}/tasks.md`);
  if (isImplemented(spec) || !tasksComplete(tasks)) continue;

  const hash = criteriaHash(spec);
  const hasCurrentRecord = listRecords(root, feature).some(
    (r) => r.commit && r.cleanTree && r.criteriaHash === hash && codeUnchangedSince(root, r.commit),
  );
  if (!hasCurrentRecord) pending.push(feature);
}

if (pending.length) {
  const reason =
    `Spec(s) com todas as tarefas concluídas e sem verificação para o código atual: ${pending.join(', ')}. ` +
    `Nenhuma spec é declarada pronta sem o verificador. ${pending.map(verifierInvocation).join(' ')}`;
  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
}
process.exit(0);
