#!/usr/bin/env node
// PreToolUse(Bash) hook scoped to the verificador-spec subagent (see its
// frontmatter). Deny by default: only the checks from rules/checks.md and
// read-only git commands are allowed. This is what keeps the verifier from
// fixing code, committing, migrating, seeding or deploying.
//
// Fails closed twice: any error inside this script denies the command, and the
// frontmatter sets `onFailure: block` for crashes before this code runs.

import fs from 'node:fs';
import path from 'node:path';

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

// Shell metacharacters that would allow chaining, redirection or substitution.
const FORBIDDEN_CHARS = /[;&|<>`$\n\r\\]/;
// git flags that write to disk even on read-only subcommands.
const FORBIDDEN_FLAGS = /(?:^| )(?:--output(?:=| )|-o )/;

function pinnedPnpmVersion(cwd) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    return /^pnpm@([\d.]+)$/.exec(pkg.packageManager ?? '')?.[1] ?? null;
  } catch {
    return null;
  }
}

try {
  const { readStdinJson } = await import('../../scripts/spec-verification.mjs');
  const input = await readStdinJson();
  if (input.tool_name !== 'Bash') process.exit(0);

  const cwd = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const pnpmVersion = pinnedPnpmVersion(cwd);
  const runner = pnpmVersion ? `(?:pnpm|npx -y pnpm@${pnpmVersion.replace(/\./g, '\\.')})` : 'pnpm';

  const ALLOWED = [
    // pnpm turbo run lint test build --filter=...[origin/main]
    // `npx -y pnpm@<packageManager version>` is accepted where pnpm is not on
    // PATH (see docs/handoff.md); the version is pinned to package.json.
    new RegExp(
      `^${runner} (?:exec )?turbo run(?: (?:lint|test|build))+` +
        `(?: --(?:filter|output-logs|log-order)(?:=| )\\S+| --continue| --summarize=false)*$`,
    ),
    // read-only git
    /^git (?:status|diff|log|show|rev-parse|ls-files|merge-base)(?: \S+)*$/,
    /^git branch --show-current$/,
  ];

  const raw = String(input.tool_input?.command ?? '').trim();
  const command = raw.replace(/[ \t]+/g, ' ');

  const help =
    'O verificador-spec só pode rodar, a partir da raiz do repositório e sem cd/encadeamento: ' +
    '`pnpm turbo run lint test --filter=...[<base>]`, `pnpm turbo run build --filter=...[<base>]` ' +
    (pnpmVersion ? `(onde pnpm não está no PATH: \`npx -y pnpm@${pnpmVersion} turbo run …\`) ` : '') +
    'e git somente leitura (status, diff, log, show, rev-parse, ls-files, merge-base). ' +
    'Ele não corrige, não commita, não migra, não popula banco e não publica: devolva o achado ao agente principal.';

  if (FORBIDDEN_CHARS.test(raw)) deny(`Comando bloqueado (encadeamento, redirecionamento ou substituição): ${command}. ${help}`);
  if (FORBIDDEN_FLAGS.test(command)) deny(`Comando bloqueado (flag que grava arquivo): ${command}. ${help}`);
  if (!ALLOWED.some((re) => re.test(command))) deny(`Comando fora da lista permitida: ${command}. ${help}`);
  process.exit(0);
} catch (err) {
  deny(`Guarda do verificador falhou (${err?.message ?? err}); comando bloqueado por segurança.`);
}
