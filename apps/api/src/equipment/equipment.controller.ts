import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard, type AuthenticatedUser } from "../auth/auth.guard.js";
import { CurrentUser } from "../auth/current-user.js";
import { CurrentMembership } from "../auth/membership.js";
import { type CatalogItem, EquipmentService } from "./equipment.service.js";

@Controller("equipment")
@UseGuards(AuthGuard)
export class EquipmentController {
  constructor(
    private readonly memberships: CurrentMembership,
    private readonly equipment: EquipmentService,
  ) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser): Promise<{ items: CatalogItem[] }> {
    return this.equipment.catalog(await this.memberships.resolve(user.userId));
  }
}
