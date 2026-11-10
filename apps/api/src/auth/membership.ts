import { Injectable } from "@nestjs/common";
import type { MembershipRole } from "../generated/prisma/client.js";
import { Problem } from "../common/problem.js";
import { PrismaService } from "../prisma/prisma.service.js";

export type Membership = {
  userId: string;
  email: string;
  fullName: string;
  role: MembershipRole;
  tenantId: string;
  tenant: { slug: string; name: string };
  loanLimit: number;
  loanPeriodDays: number;
};

// v1: every account belongs to exactly one tenant (spec login, decisões).
// Tenant and role come from the membership of the verified user id, never
// from anything else in the request (ADR 001 §2.6).
@Injectable()
export class CurrentMembership {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(userId: string): Promise<Membership> {
    const found = await this.prisma.membership.findMany({
      where: { userId },
      take: 2, // enough to tell "exactly one" from "more than one"
      select: {
        role: true,
        tenantId: true,
        profile: { select: { email: true, fullName: true } },
        tenant: { select: { slug: true, name: true, loanLimit: true, loanPeriodDays: true } },
      },
    });
    if (found.length !== 1) {
      throw new Problem(
        403,
        "no_membership",
        found.length === 0
          ? "A conta não tem vínculo com nenhum tenant."
          : "A conta tem vínculo com mais de um tenant, o que esta versão não suporta.",
      );
    }
    const [{ role, tenantId, profile, tenant }] = found;
    return {
      userId,
      email: profile.email,
      fullName: profile.fullName,
      role,
      tenantId,
      tenant: { slug: tenant.slug, name: tenant.name },
      loanLimit: tenant.loanLimit,
      loanPeriodDays: tenant.loanPeriodDays,
    };
  }
}
