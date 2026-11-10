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

// Commands that write schema or data through Prisma or the package scripts.
const DB_WRITE = [
  /prisma\s+migrate\s+(?:dev|reset|deploy|resolve)\b/,
  /prisma\s+db\s+(?:seed|push|execute)\b/,
  /\bdb:(?:deploy|seed)\b/,
  /prisma\/seed\.ts\b/,
];

// Allowed only as ONE command whose own environment points DIRECT_URL at a
// local host, with nothing chained before or after (a local DIRECT_URL on
// another command in the line would not apply to the database command):
//   DIRECT_URL="postgresql://u:p@localhost:5433/db" npx prisma migrate dev ...
//   $env:DIRECT_URL = "postgresql://u:p@127.0.0.1:5433/db"; npx prisma migrate dev ...
const LOCAL_URL = String.raw`["']?postgres(?:ql)?:\/\/[^@\s"';&|]*@(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\/[^\s"';&|]*["']?`;
const REST = String.raw`[^;&|<>\x60\n\r$()]+`; // the db command itself: no chaining, redirection or substitution
const LOCAL_DIRECT_URL = new RegExp(
  String.raw`^\s*(?:DIRECT_URL=${LOCAL_URL}\s+${REST}|\$env:DIRECT_URL\s*=\s*${LOCAL_URL}\s*;\s*${REST})$`,
);

try {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  const command = String(input.tool_input?.command ?? '');

  // A single git command only mentions these in its message.
  const skeleton = command.replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*$/, '').trim();
  if (/^git\s/.test(skeleton) && !/[;|&<>`\n]|\$\(|\s-c\s|alias/.test(skeleton)) process.exit(0);

  if (DB_WRITE.some((re) => re.test(command)) && !LOCAL_DIRECT_URL.test(command)) {
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
