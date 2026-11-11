import { Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import { AuthGuard, type AuthenticatedUser } from "../auth/auth.guard.js";
import { CurrentUser } from "../auth/current-user.js";
import { CurrentMembership } from "../auth/membership.js";
import { Problem } from "../common/problem.js";
import { type CreatedLoan, LoansService, type MyLoans } from "./loans.service.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Only equipmentId is read from the body: borrower and tenant come from the
// verified token (spec solicitar-emprestimo, CA-5).
@Controller("loans")
@UseGuards(AuthGuard)
export class LoansController {
  constructor(
    private readonly memberships: CurrentMembership,
    private readonly loans: LoansService,
  ) {}

  @Post()
  @HttpCode(201)
  async request(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown): Promise<CreatedLoan> {
    const equipmentId = (body as { equipmentId?: unknown } | null)?.equipmentId;
    if (typeof equipmentId !== "string" || !UUID.test(equipmentId)) {
      throw new Problem(400, "invalid_request", "Informe o equipamento (equipmentId) a solicitar.");
    }
    return this.loans.request(await this.memberships.resolve(user.userId), equipmentId);
  }

  @Get("mine")
  async mine(@CurrentUser() user: AuthenticatedUser): Promise<MyLoans> {
    return this.loans.mine(await this.memberships.resolve(user.userId));
  }
}
