import type { INestApplication } from "@nestjs/common";

// ADR 001 §2.4: routes are versioned under /v1. Shared by main.ts and the tests
// so both boot the app with the same configuration.
export const DEFAULT_API_PREFIX = "v1";

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(process.env.API_PREFIX ?? DEFAULT_API_PREFIX);
}
