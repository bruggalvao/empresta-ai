import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { supabaseAuthAdmin } from "./seed/auth";
import { loadSeedInput } from "./seed/data";
import { assertSafeTarget } from "./seed/guard";
import { runSeed } from "./seed/run";

// Entry point for `prisma db seed` (see prisma.config.ts). Logic and tests
// live in prisma/seed/. The professor's password comes only from
// PROFESSOR_INITIAL_PASSWORD (apps/api/.env), never from this repository.
async function main() {
  assertSafeTarget(process.env);
  const input = await loadSeedInput(process.env);

  const { DIRECT_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const missing = Object.entries({ DIRECT_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) throw new Error(`seed não executado, faltam em apps/api/.env: ${missing.join(", ")}`);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: DIRECT_URL }) });
  try {
    const summary = await runSeed(prisma, supabaseAuthAdmin(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!), input);
    console.log(`Tenant suporte_ti: ${summary.tenantId}`);
    console.log(`Equipamentos garantidos: ${summary.equipment}`);
    console.log(
      `Professor ${input.professor.email}: ${summary.professorCreated ? "conta criada" : "conta já existia (senha mantida)"}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
