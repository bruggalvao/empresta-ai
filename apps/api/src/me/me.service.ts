import { Injectable } from "@nestjs/common";
import type { MembershipRole } from "../generated/prisma/client.js";
import { CurrentMembership } from "../auth/membership.js";

export type MeResponse = {
  userId: string;
  email: string;
  fullName: string;
  role: MembershipRole;
  tenant: { slug: string; name: string };
};

@Injectable()
export class MeService {
  constructor(private readonly memberships: CurrentMembership) {}

  async get(userId: string): Promise<MeResponse> {
    const { email, fullName, role, tenant } = await this.memberships.resolve(userId);
    return { userId, email, fullName, role, tenant };
  }
}
