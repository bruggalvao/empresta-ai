import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard, type AuthenticatedUser } from "../auth/auth.guard.js";
import { CurrentUser } from "../auth/current-user.js";
import { type MeResponse, MeService } from "./me.service.js";

@Controller("me")
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly me: MeService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser): Promise<MeResponse> {
    return this.me.get(user.userId);
  }
}
