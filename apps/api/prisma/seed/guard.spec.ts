// CA-8: the agent cannot seed or migrate production.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertSafeTarget } from "./guard.js";

const PROD_DB = "postgresql://postgres:x@db.bnxelaknojdqswytnmuc.supabase.co:5432/postgres";
const PROD_AUTH = "https://bnxelaknojdqswytnmuc.supabase.co";
const LOCAL_DB = "postgresql://postgres:postgres@localhost:55432/empresta";
const LOCAL_AUTH = "http://127.0.0.1:54321";

const HOOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../.claude/hooks/guard-production-db.mjs");

function hookDecision(command: string): "allow" | "deny" {
  const out = execFileSync("node", [HOOK], {
    input: JSON.stringify({ tool_name: "Bash", tool_input: { command } }),
    encoding: "utf8",
  });
  return out.includes('"deny"') ? "deny" : "allow";
}

describe("proteção de produção", () => {
  it("CA-8: seed executado por agente recusa banco ou Auth fora de localhost", () => {
    expect(() => assertSafeTarget({ CLAUDECODE: "1", DIRECT_URL: PROD_DB, SUPABASE_URL: PROD_AUTH })).toThrow(
      /DIRECT_URL e SUPABASE_URL fora de localhost/,
    );
    expect(() => assertSafeTarget({ CLAUDECODE: "1", DIRECT_URL: LOCAL_DB, SUPABASE_URL: PROD_AUTH })).toThrow(
      /SUPABASE_URL fora de localhost/,
    );
    expect(() => assertSafeTarget({ CLAUDECODE: "1", DIRECT_URL: LOCAL_DB, SUPABASE_URL: LOCAL_AUTH })).not.toThrow();
    // A person in their own terminal (no CLAUDECODE) may seed production.
    expect(() => assertSafeTarget({ DIRECT_URL: PROD_DB, SUPABASE_URL: PROD_AUTH })).not.toThrow();
  });

  it("CA-8: o hook nega ao agente migration e seed de produção e libera banco local declarado no comando", () => {
    for (const command of [
      "npx prisma migrate deploy",
      "npx -y pnpm@12.5.1 --filter api db:deploy",
      "npx -y pnpm@12.5.1 --filter api db:seed",
      "npx prisma db seed",
      "npx tsx prisma/seed.ts",
      `DIRECT_URL="${PROD_DB}" npx prisma migrate deploy`,
      // A local DIRECT_URL on another command does not apply to the db command.
      `DIRECT_URL="${LOCAL_DB}" true; npx prisma migrate deploy`,
      `DIRECT_URL="${LOCAL_DB}" true && npx -y pnpm@12.5.1 --filter api db:seed`,
      `DIRECT_URL="${LOCAL_DB}" npx prisma migrate dev; npx prisma migrate deploy`,
      `echo DIRECT_URL="${LOCAL_DB}" | npx prisma migrate deploy`,
      `$env:DIRECT_URL = "${LOCAL_DB}"; Write-Host x; npx prisma migrate deploy`,
    ]) {
      expect([command, hookDecision(command)]).toEqual([command, "deny"]);
    }
    expect(hookDecision(`DIRECT_URL="${LOCAL_DB}" npx prisma migrate dev --name x`)).toBe("allow");
    expect(hookDecision(`$env:DIRECT_URL = "${LOCAL_DB}"; npx prisma migrate deploy`)).toBe("allow");
    expect(hookDecision("npx prisma generate")).toBe("allow");
  });
});
