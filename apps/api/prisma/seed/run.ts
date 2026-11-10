// Idempotent: safe to run any number of times (ADR 001 §2.5, CA-6).
//   - tenant and equipment: one transaction, upsert by natural key;
//     an existing equipment keeps its status (Operations owns it after load);
//   - professor account: created only if missing, never re-passworded;
//   - profile and EMPLOYEE membership: upsert. No loans are ever created.

import type { PrismaClient } from "../../src/generated/prisma/client.js";
import type { AuthAdmin } from "./auth.js";
import type { SeedInput } from "./data.js";

export type SeedSummary = {
  tenantId: string;
  equipment: number;
  professorUserId: string;
  professorCreated: boolean;
};

// Prisma's interactive-transaction defaults (maxWait 2s to get a connection,
// timeout 5s overall) are too tight for a remote Supabase: the first TLS
// connection alone can take longer than 2s, and 13 sequential upserts pay one
// round trip each. A one-off load can afford to wait.
export const SEED_TRANSACTION_OPTIONS = { maxWait: 30_000, timeout: 120_000 } as const;

export async function runSeed(prisma: PrismaClient, auth: AuthAdmin, input: SeedInput): Promise<SeedSummary> {
  const tenant = await prisma.$transaction(async (tx) => {
    const t = await tx.tenant.upsert({
      where: { slug: input.tenant.slug },
      update: {},
      create: { slug: input.tenant.slug, name: input.tenant.name },
    });
    for (const e of input.equipment) {
      await tx.equipment.upsert({
        where: { tenantId_assetTag: { tenantId: t.id, assetTag: e.assetTag } },
        update: { name: e.name, category: e.category, imagePath: e.imagePath },
        create: {
          tenantId: t.id,
          assetTag: e.assetTag,
          name: e.name,
          category: e.category,
          status: "AVAILABLE",
          imagePath: e.imagePath,
        },
      });
    }
    return t;
  }, SEED_TRANSACTION_OPTIONS);

  const { email, fullName, password } = input.professor;
  let userId = await auth.findUserIdByEmail(email);
  const professorCreated = !userId;
  if (!userId) userId = await auth.createUser({ email, password, emailConfirmed: true });

  await prisma.profile.upsert({
    where: { userId },
    update: { fullName, email },
    create: { userId, fullName, email },
  });
  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId } },
    update: {},
    create: { tenantId: tenant.id, userId, role: "EMPLOYEE" },
  });

  return { tenantId: tenant.id, equipment: input.equipment.length, professorUserId: userId, professorCreated };
}
