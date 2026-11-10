import { Global, Module } from "@nestjs/common";
import { AUTH_SETTINGS, authSettingsFromEnv } from "./auth.config.js";
import { AuthGuard } from "./auth.guard.js";

// Tests override AUTH_SETTINGS with a local key set and issuer.
@Global()
@Module({
  providers: [{ provide: AUTH_SETTINGS, useFactory: () => authSettingsFromEnv() }, AuthGuard],
  exports: [AUTH_SETTINGS, AuthGuard],
})
export class AuthModule {}
