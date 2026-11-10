import type { INestApplication } from "@nestjs/common";
import { ProblemDetailsFilter } from "./common/problem.filter.js";

// ADR 001 §2.4: routes are versioned under /v1. Shared by main.ts, the Vercel
// entry and the tests so all boot the app with the same configuration.
export const DEFAULT_API_PREFIX = "v1";

// ADR 001 §2.7: CORS allowlist with the front's origin(s). CORS_ORIGIN may
// list several origins separated by commas; without it, no browser origin
// is allowed.
export function corsOrigins(value = process.env.CORS_ORIGIN): string[] {
  return (value ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(process.env.API_PREFIX ?? DEFAULT_API_PREFIX);
  app.enableCors({
    origin: corsOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
  });
  app.useGlobalFilters(new ProblemDetailsFilter());
}
