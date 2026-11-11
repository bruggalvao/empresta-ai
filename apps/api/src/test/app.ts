// Test-only: the real app on a Testcontainers Postgres, with Supabase's JWKS
// replaced by a key pair generated here.
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { AppModule } from "../app.module.js";
import { configureApp } from "../app.setup.js";
import { AUTH_SETTINGS, type AuthSettings } from "../auth/auth.config.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { startDatabase } from "./database.js";

const ISSUER = "https://projeto-teste.supabase.co/auth/v1";

export type TestApp = {
  app: INestApplication;
  prisma: PrismaService;
  token(sub: string): Promise<string>;
  close(): Promise<void>;
};

export async function startTestApp(): Promise<TestApp> {
  const { privateKey, publicKey } = await generateKeyPair("ES256");
  const jwk = await exportJWK(publicKey);
  const keys = createLocalJWKSet({ keys: [{ ...jwk, kid: "test-key", alg: "ES256", use: "sig" }] });

  const container: StartedPostgreSqlContainer = await startDatabase();
  process.env.DATABASE_URL = container.getConnectionUri();

  const settings: AuthSettings = { config: () => ({ issuer: ISSUER, audience: "authenticated" }), keys: () => keys };
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AUTH_SETTINGS)
    .useValue(settings)
    .compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
    token: (sub) =>
      new SignJWT({ role: "authenticated" })
        .setProtectedHeader({ alg: "ES256", kid: "test-key" })
        .setSubject(sub)
        .setIssuer(ISSUER)
        .setAudience("authenticated")
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(privateKey),
    close: async () => {
      await app.close();
      await container.stop();
    },
  };
}
