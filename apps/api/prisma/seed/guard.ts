// Second layer behind .claude/hooks/guard-production-db.mjs: when an agent
// runs the seed (CLAUDECODE set), both the database and Supabase Auth must
// be local. Production is seeded by a person in their own terminal.

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function isLocalUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

// Prisma CLI commands that write schema or data. Checked on the CLI's own
// argv (prisma.config.ts), after the shell has expanded quotes, variables
// and escapes, so no shell syntax hides them.
const WRITE_SUBCOMMANDS: Record<string, string[]> = {
  migrate: ["dev", "reset", "deploy", "resolve"],
  db: ["push", "seed", "execute"],
};

export function isPrismaWriteCommand(argv: string[]): boolean {
  return Object.entries(WRITE_SUBCOMMANDS).some(
    ([command, subcommands]) => argv.includes(command) && argv.some((a) => subcommands.includes(a)),
  );
}

// Called from prisma.config.ts, which every Prisma CLI command loads.
export function assertSafePrismaCommand(argv: string[], env: NodeJS.ProcessEnv = process.env): void {
  if (!env.CLAUDECODE || !isPrismaWriteCommand(argv)) return;
  if (!isLocalUrl(env.DIRECT_URL)) {
    throw new Error(
      `prisma ${argv.join(" ")} recusado: executado por agente (CLAUDECODE) com DIRECT_URL fora de localhost. ` +
        "Migration e seed de produção são rodados por uma pessoa: npx -y pnpm@12.5.1 --filter api db:deploy",
    );
  }
}

export function assertSafeTarget(env: NodeJS.ProcessEnv = process.env): void {
  if (!env.CLAUDECODE) return;
  const remote = ["DIRECT_URL", "SUPABASE_URL"].filter((key) => !isLocalUrl(env[key]));
  if (remote.length) {
    throw new Error(
      `seed recusado: executado por agente (CLAUDECODE) com ${remote.join(" e ")} fora de localhost. ` +
        "Produção é populada por uma pessoa: npx -y pnpm@12.5.1 --filter api db:seed",
    );
  }
}
