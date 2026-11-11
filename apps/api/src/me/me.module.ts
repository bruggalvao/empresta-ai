import { Module } from "@nestjs/common";
import { MeController } from "./me.controller.js";
import { MeService } from "./me.service.js";
import { MembershipRepository } from "./membership.repository.js";

@Module({ controllers: [MeController], providers: [MeService, MembershipRepository] })
export class MeModule {}
