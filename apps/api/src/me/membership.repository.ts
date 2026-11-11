import { Injectable } from "@nestjs/common";
import type { MembershipRole } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";

export type MembershipWithProfile = {
  role: MembershipRole;
  profile: { userId: string; email: string; fullName: string };
  tenant: { slug: string; name: string };
};

@Injectable()
export class MembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  // At most two rows: enough to tell "exactly one" from "more than one".
  findByUserId(userId: string): Promise<MembershipWithProfile[]> {
    return this.prisma.membership.findMany({
      where: { userId },
      take: 2,
      select: {
        role: true,
        profile: { select: { userId: true, email: true, fullName: true } },
        tenant: { select: { slug: true, name: true } },
      },
    });
  }
}
