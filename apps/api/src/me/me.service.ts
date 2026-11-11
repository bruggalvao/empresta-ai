import { ForbiddenException, Injectable } from "@nestjs/common";
import type { MembershipRole } from "../generated/prisma/client.js";
import { MembershipRepository } from "./membership.repository.js";

export type MeResponse = {
  userId: string;
  email: string;
  fullName: string;
  role: MembershipRole;
  tenant: { slug: string; name: string };
};

// v1: every account belongs to exactly one tenant (spec login, decisões).
// The tenant is the account's membership, found by the verified user id.
@Injectable()
export class MeService {
  constructor(private readonly memberships: MembershipRepository) {}

  async get(userId: string): Promise<MeResponse> {
    const found = await this.memberships.findByUserId(userId);
    if (found.length !== 1) {
      throw new ForbiddenException(
        found.length === 0
          ? "A conta não tem vínculo com nenhum tenant."
          : "A conta tem vínculo com mais de um tenant, o que esta versão não suporta.",
      );
    }
    const [{ role, profile, tenant }] = found;
    return { userId: profile.userId, email: profile.email, fullName: profile.fullName, role, tenant };
  }
}
