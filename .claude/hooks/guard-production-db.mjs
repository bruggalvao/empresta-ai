#!/usr/bin/env node
// PreToolUse hook (project settings) for Bash|PowerShell: the agent may run
// migrations and the seed only against a local database declared in the
// command itself. Without that, prisma.config.ts would load DIRECT_URL from
// apps/api/.env, which points at production.
//
// Second layer: apps/api/prisma/seed/guard.ts refuses non-local targets when
// CLAUDECODE is set. Fails closed: settings.json sets onFailure: block.

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

// Commands that write schema or data. Matched on a normalized copy (quotes,
// backslashes and backticks removed, so `npx prisma "migrate" deploy` is
// caught) and without requiring a "prisma" prefix (prisma@7, node
// .../prisma/build/index.js, wrappers). Over-matching only costs a denial.
const DB_WRITE = [
  /\bmigrate\b(?:\s+\S+)*?\s+(?:dev|reset|deploy|resolve)\b/,
  /\bdb\b(?:\s+\S+)*?\s+(?:seed|push|execute)\b/,
  /\bdb:(?:deploy|seed)\b/,
  /\bseed\.(?:ts|js|mjs)\b/,
];
const normalize = (s) => s.replace(/\\\r?\n/g, ' ').replace(/["'`\\]/g, '');

// Allowed only as ONE command whose own environment points DIRECT_URL at a
// local host. The rest of the line: a known runner, no chaining, pipes,
// redirection or substitution, and no second DIRECT_URL or `env`, which
// could replace the local value.
//   Bash:       DIRECT_URL="postgresql://u:p@localhost:5433/db" npx prisma migrate dev ...
//   PowerShell: $env:DIRECT_URL = "postgresql://u:p@127.0.0.1:5433/db"; npx prisma migrate dev ...
// The PowerShell form is accepted only from the PowerShell tool: in Bash,
// `$env:...` expands to nothing and the `;` would run the command unguarded.
const LOCAL_URL = String.raw`["']?postgres(?:ql)?:\/\/[^@\s"';&|]*@(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\/[^\s"';&|]*["']?`;
const REST = String.raw`(?![\s\S]*\b(?:DIRECT_URL|env)\b)(?:npx|pnpm|node|prisma)\s[^;&|<>\x60\n\r$()]+`;
const BASH_LOCAL = new RegExp(String.raw`^\s*DIRECT_URL=${LOCAL_URL}\s+${REST}$`);
const POWERSHELL_LOCAL = new RegExp(String.raw`^\s*\$env:DIRECT_URL\s*=\s*${LOCAL_URL}\s*;\s*${REST}$`);

try {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  const command = String(input.tool_input?.command ?? '');

  // A single git command only mentions these in its message.
  const skeleton = command.replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*$/, '').trim();
  if (/^git\s/.test(skeleton) && !/[;|&<>`\n]|\$\(|\s-c\s|alias/.test(skeleton)) process.exit(0);

  const local = input.tool_name === 'PowerShell' ? POWERSHELL_LOCAL.test(command) : BASH_LOCAL.test(command);
  if (DB_WRITE.some((re) => re.test(normalize(command))) && !local) {
    deny(
      'Migration e seed contra o banco do apps/api/.env (produção) são rodados por uma pessoa, não pelo agente. ' +
        'Para banco local, declare no próprio comando: DIRECT_URL="postgresql://...@localhost:<porta>/<db>" <comando>. ' +
        'Para produção, peça ao usuário: npx -y pnpm@12.5.1 --filter api db:deploy e depois db:seed.',
    );
  }
  process.exit(0);
} catch (err) {
  deny(`Guarda de banco de produção falhou (${err?.message ?? err}); comando bloqueado por segurança.`);
}
