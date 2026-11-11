#!/usr/bin/env node
// PreToolUse hook (project settings) for Bash|PowerShell: the agent may
// prepare equipment images, but never send them to Supabase Storage. The
// upload is run by a person in their own terminal.
//
// Second layer: packages/equipment-images/src/upload.mjs refuses to run when
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

try {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  const input = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  const command = String(input.tool_input?.command ?? '');

  // A single git command (commit message in a heredoc or quotes) cannot run
  // the upload; only its message mentions it.
  const skeleton = command.replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\s*$/, '').trim();
  // `git -c alias.x='!cmd'` would run a shell command, so -c/alias is not plain git.
  if (/^git\s/.test(skeleton) && !/[;|&<>`\n]|\$\(|\s-c\s|alias/.test(skeleton)) process.exit(0);

  // "upload" as its own word: not part of a name like guard-image-upload.mjs.
  const uploadWord = /(?<![\w-])upload(?![\w-])/;
  const runsUpload =
    /images:upload/.test(command) ||
    /(?:^|[\s/\\"'])upload\.mjs/.test(command) ||
    (/cli\.mjs/.test(command) && uploadWord.test(command)) ||
    (/equipment-images/.test(command) && uploadWord.test(command));

  if (runsUpload) {
    deny(
      'Envio de imagens ao Supabase é feito por uma pessoa, não pelo agente. ' +
        'Peça ao usuário para rodar no terminal dele: pnpm --filter equipment-images images:upload',
    );
  }
  process.exit(0);
} catch (err) {
  deny(`Guarda de upload falhou (${err?.message ?? err}); comando bloqueado por segurança.`);
}
