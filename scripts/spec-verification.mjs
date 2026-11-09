#!/usr/bin/env node
// Shared logic for the verificador-spec workflow.
//
// Used by:
//   - .claude/hooks/*.mjs (Claude Code hooks: trigger, status gate, record writer)
//   - CI (`node scripts/spec-verification.mjs check --base <ref>`)
//
// A "verification record" is a markdown file written by the SubagentStop hook of
// verificador-spec into docs/specs/<feature>/verificacoes/. A record is
// "current" for a given code state when:
//   - it was taken on a clean tree (code paths only),
//   - the acceptance criteria section of spec.md has not changed since, and
//   - no code path changed between the recorded commit and the state checked.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SPECS_DIR = 'docs/specs';
export const RECORDS_DIRNAME = 'verificacoes';

// Fallback scope, for specs whose plan.md does not declare one: everything
// that is not documentation/agent configuration counts as code.
export const CODE_PATHSPEC = [
  '.',
  ':(exclude)docs',
  ':(exclude)rules',
  ':(exclude).claude',
  ':(exclude).agents',
  ':(exclude).github',
  ':(exclude)*.md',
  ':(exclude)*.html',
];

// Per-spec scope: plan.md declares the code that can affect its acceptance
// criteria, in one line:
//   Escopo de código: `apps/web/src` · `apps/web/package.json`
// Only changes inside the scope make a verification stale.
export const SCOPE_LINE = /^Escopo de código:\s*(.+)$/im;

export function parseCodeScope(planText) {
  const m = SCOPE_LINE.exec(planText ?? '');
  if (!m) return null;
  const paths = [...m[1].matchAll(/`([^`]+)`/g)].map((x) => x[1].trim().replace(/\\/g, '/').replace(/\/+$/, ''));
  const valid = paths.length > 0 && paths.every((p) => p && !p.startsWith('/') && !p.split('/').includes('..') && !p.startsWith(':'));
  return valid ? paths : null;
}

export function planRelPath(feature) {
  return `${SPECS_DIR}/${feature}/plan.md`;
}

// rev === null reads plan.md from the working tree; otherwise from that commit.
export function codeScope(root, feature, rev = null) {
  const rel = planRelPath(feature);
  const plan = rev
    ? readFileAt(root, rev, rel)
    : fs.existsSync(path.join(root, rel))
      ? fs.readFileSync(path.join(root, rel), 'utf8')
      : null;
  return parseCodeScope(plan) ?? CODE_PATHSPEC;
}

export const describeScope = (pathspec) => (pathspec === CODE_PATHSPEC ? 'repositório inteiro (plan.md sem escopo)' : pathspec.join(' · '));

export function git(root, args, { allowFail = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    if (allowFail) return null;
    throw err;
  }
}

function gitQuiet(root, args) {
  try {
    execFileSync('git', args, { cwd: root, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function repoRoot(start = process.cwd()) {
  return git(start, ['rev-parse', '--show-toplevel']);
}

export function headSha(root) {
  return git(root, ['rev-parse', 'HEAD']);
}

export function readFileAt(root, rev, relPath) {
  return git(root, ['show', `${rev}:${relPath}`], { allowFail: true });
}

// ---------------------------------------------------------------------------
// Spec parsing

export function listSpecs(root) {
  const base = path.join(root, SPECS_DIR);
  if (!fs.existsSync(base)) return [];
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)
    .filter((name) => fs.existsSync(path.join(base, name, 'spec.md')))
    .sort();
}

export function specRelPath(feature) {
  return `${SPECS_DIR}/${feature}/spec.md`;
}

export function parseStatus(specText) {
  const m = /^Status:\s*(.+)$/im.exec(specText ?? '');
  return m ? m[1].trim().toLowerCase() : null;
}

export function isImplemented(specText) {
  return parseStatus(specText) === 'implementada';
}

// Acceptance criteria section, normalized so ticking a checkbox does not
// count as a change in the criteria themselves.
export function criteriaSection(specText) {
  const text = (specText ?? '').replace(/\r\n/g, '\n');
  const m = /^##\s+Crit[ée]rios de aceite\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/im.exec(text);
  if (!m) return '';
  return m[1]
    .replace(/^(\s*-\s*)\[[xX ]\]/gm, '$1[ ]')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

export function criteriaHash(specText) {
  return createHash('sha1').update(criteriaSection(specText)).digest('hex').slice(0, 12);
}

// True when tasks.md has at least one checkbox and all of them are ticked.
export function tasksComplete(tasksText) {
  const boxes = (tasksText ?? '').match(/^\s*-\s*\[[ xX]\]/gm) ?? [];
  if (boxes.length === 0) return false;
  return boxes.every((b) => /\[[xX]\]/.test(b));
}

// ---------------------------------------------------------------------------
// Code state

// Without a declared scope, untracked files only matter where code lives.
const FALLBACK_UNTRACKED_DIRS = ['apps', 'packages', 'scripts'];

function untrackedCodeFiles(root, pathspec) {
  const where =
    pathspec === CODE_PATHSPEC ? FALLBACK_UNTRACKED_DIRS.filter((d) => fs.existsSync(path.join(root, d))) : pathspec;
  if (!where.length) return [];
  return git(root, ['ls-files', '--others', '--exclude-standard', '--', ...where])
    .split('\n')
    .filter(Boolean);
}

// Modified tracked files plus untracked files inside the scope.
export function dirtyCodeFiles(root, pathspec = CODE_PATHSPEC) {
  const tracked = git(root, ['status', '--porcelain', '--untracked-files=no', '--', ...pathspec])
    .split('\n')
    .filter(Boolean);
  return [...tracked, ...untrackedCodeFiles(root, pathspec).map((f) => `?? ${f}`)];
}

// target === null means "the working tree".
export function codeUnchangedSince(root, commit, target = null, pathspec = CODE_PATHSPEC) {
  if (!gitQuiet(root, ['cat-file', '-e', `${commit}^{commit}`])) return false;
  const args = ['diff', '--quiet', commit];
  if (target) args.push(target);
  args.push('--', ...pathspec);
  if (!gitQuiet(root, args)) return false;
  if (target === null && untrackedCodeFiles(root, pathspec).length) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Verification records

export function recordsDir(root, feature) {
  return path.join(root, SPECS_DIR, feature, RECORDS_DIRNAME);
}

const FIELD = (name) => new RegExp(`^-\\s*${name}:\\s*(.+)$`, 'im');

export function parseRecord(text) {
  const get = (name) => FIELD(name).exec(text)?.[1].trim() ?? null;
  return {
    spec: get('Spec'),
    commit: get('Commit'),
    cleanTree: (get('Árvore limpa') ?? '').toLowerCase().startsWith('sim'),
    criteriaHash: get('Hash dos CA'),
    scope: get('Escopo de código'),
    verdict: normalizeVerdict(get('Veredito')),
    date: get('Data'),
  };
}

export function normalizeVerdict(v) {
  if (!v) return null;
  const s = v.toUpperCase();
  if (/N[ÃA]O\s+PRONTA/.test(s)) return 'NÃO PRONTA';
  if (/\bPRONTA\b/.test(s)) return 'PRONTA';
  return null;
}

export function listRecords(root, feature) {
  const dir = recordsDir(root, feature);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort() // file names start with a UTC timestamp
    .map((f) => {
      const file = path.join(dir, f);
      return { file, ...parseRecord(fs.readFileSync(file, 'utf8')) };
    });
}

// A record is valid for a state when: taken on a clean scope, same acceptance
// criteria, same declared scope (a record made under another scope does not
// count; records older than scopes carry none) and no change inside the scope
// since the recorded commit.
export function isRecordCurrent(root, record, { hash, pathspec, target = null }) {
  return Boolean(
    record.commit &&
      record.cleanTree &&
      record.criteriaHash === hash &&
      (!record.scope || record.scope === describeScope(pathspec)) &&
      codeUnchangedSince(root, record.commit, target, pathspec),
  );
}

// Latest record that is still valid for the given state.
//   specText: current spec.md content (or the content about to be written)
//   target:   null for the working tree, or a commit-ish (CI)
export function currentRecord(root, feature, specText, target = null) {
  const opts = { hash: criteriaHash(specText), pathspec: codeScope(root, feature, target), target };
  return listRecords(root, feature).reverse().find((r) => isRecordCurrent(root, r, opts)) ?? null;
}

export function featureFromSpecPath(p) {
  const norm = p.replace(/\\/g, '/');
  const m = /(?:^|\/)docs\/specs\/([^/]+)\/spec\.md$/.exec(norm);
  return m && !m[1].startsWith('_') ? m[1] : null;
}

export function isRecordPath(p) {
  return /(?:^|\/)docs\/specs\/[^/]+\/verificacoes(\/|$)/.test(p.replace(/\\/g, '/'));
}

export function verifierInvocation(feature) {
  return (
    `Acione o subagent verificador-spec com: spec = ${specRelPath(feature)}; ` +
    `o que verificar = intervalo de commits da spec (ex.: <base>..HEAD) ou "tudo que implementa esta spec". ` +
    `Commite o código antes: verificação com árvore suja não vale como registro.`
  );
}

// ---------------------------------------------------------------------------
// Hook I/O helpers

export async function readStdinJson() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw.trim() ? JSON.parse(raw) : {};
}

// ---------------------------------------------------------------------------
// CI entry point

function ciCheck(root, base) {
  const errors = [];
  const notes = [];
  for (const feature of listSpecs(root)) {
    const rel = specRelPath(feature);
    const headSpec = readFileAt(root, 'HEAD', rel);
    if (!headSpec || !isImplemented(headSpec)) continue;
    const baseSpec = readFileAt(root, base, rel);
    const changedInPr = !baseSpec || !isImplemented(baseSpec) || criteriaHash(baseSpec) !== criteriaHash(headSpec);
    if (!changedInPr) continue;
    const rec = currentRecord(root, feature, headSpec, 'HEAD');
    if (!rec) {
      errors.push(`${feature}: marcada como implementada sem registro do verificador válido para o código deste PR.`);
    } else if (rec.verdict !== 'PRONTA') {
      errors.push(`${feature}: último registro válido tem veredito ${rec.verdict ?? 'desconhecido'} (${path.relative(root, rec.file)}).`);
    } else {
      notes.push(`${feature}: OK (${path.relative(root, rec.file).replace(/\\/g, '/')}).`);
    }
  }
  for (const n of notes) console.log(n);
  if (errors.length) {
    for (const e of errors) console.error(`ERRO ${e}`);
    process.exit(1);
  }
  console.log('Verificação de specs: nada pendente.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  const baseIdx = rest.indexOf('--base');
  const base = baseIdx >= 0 ? rest[baseIdx + 1] : 'origin/main';
  if (cmd !== 'check') {
    console.error('uso: node scripts/spec-verification.mjs check [--base <ref>]');
    process.exit(2);
  }
  ciCheck(repoRoot(), base);
}
