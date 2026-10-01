import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Idempotent: safe to run any number of times (ADR 001 §2.5).
// Seeds the initial tenant only. People come from Supabase Auth invites, so
// profiles and memberships are created by the API, not here.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const tenant = await prisma.tenant.upsert({
      where: { slug: "suporte_ti" },
      update: {},
      create: { slug: "suporte_ti", name: "Suporte TI" },
    });
    console.log(`Tenant ready: ${tenant.slug} (${tenant.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
