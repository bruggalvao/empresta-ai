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
