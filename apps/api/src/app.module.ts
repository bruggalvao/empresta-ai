import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module.js";
import { EquipmentModule } from "./equipment/equipment.module.js";
import { HealthModule } from "./health/health.module.js";
import { LoansModule } from "./loans/loans.module.js";
import { MeModule } from "./me/me.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({ imports: [PrismaModule, AuthModule, HealthModule, MeModule, EquipmentModule, LoansModule] })
export class AppModule {}
