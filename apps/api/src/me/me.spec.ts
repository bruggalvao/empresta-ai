// GET /v1/me and CORS (spec login, CA-6 to CA-9). Real Postgres with the
// migrations; Supabase's JWKS replaced by a key pair generated here.

import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTVerifyGetKey, SignJWT } from "jose";
import request from "supertest";
import { AppModule } from "../app.module.js";
import { configureApp } from "../app.setup.js";
import { AUTH_SETTINGS, type AuthSettings } from "../auth/auth.config.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { startDatabase } from "../test/database.js";

const ISSUER = "https://projeto-teste.supabase.co/auth/v1";
const FRONT = "http://front.test";

type Key = Awaited<ReturnType<typeof generateKeyPair>>["privateKey"];
let signingKey: Key;
let otherKey: Key;
let keys: JWTVerifyGetKey;

let container: StartedPostgreSqlContainer;
let app: INestApplication;
let prisma: PrismaService;

const ids = { a: randomUUID(), b: randomUUID(), orphan: randomUUID(), twoTenants: randomUUID() };
const tenants = { a: "", b: "" };

function token(sub: string, opts: { key?: Key; issuer?: string; audience?: string; expiresIn?: string | number } = {}) {
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "ES256", kid: "test-key" })
    .setSubject(sub)
    .setIssuer(opts.issuer ?? ISSUER)
    .setAudience(opts.audience ?? "authenticated")
    .setIssuedAt()
    .setExpirationTime(opts.expiresIn ?? "1h")
    .sign(opts.key ?? signingKey);
}

const me = (bearer?: string) => {
  const req = request(app.getHttpServer()).get("/v1/me");
  return bearer ? req.set("Authorization", `Bearer ${bearer}`) : req;
};

function expectProblem(res: request.Response, status: number) {
  expect(res.status).toBe(status);
  expect(res.headers["content-type"]).toMatch(/^application\/problem\+json/);
  expect(res.body).toMatchObject({ type: "about:blank", status });
  expect(typeof res.body.title).toBe("string");
}

beforeAll(async () => {
  const pair = await generateKeyPair("ES256");
  signingKey = pair.privateKey;
  ({ privateKey: otherKey } = await generateKeyPair("ES256"));
  const publicJwk = await exportJWK(pair.publicKey);
  keys = createLocalJWKSet({ keys: [{ ...publicJwk, kid: "test-key", alg: "ES256", use: "sig" }] });

  container = await startDatabase();
  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.CORS_ORIGIN = `${FRONT}, http://outro-front.test`;

  const settings: AuthSettings = { config: () => ({ issuer: ISSUER, audience: "authenticated" }), keys: () => keys };
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AUTH_SETTINGS)
    .useValue(settings)
    .compile();
  app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  prisma = app.get(PrismaService);

  const [ta, tb] = await Promise.all([
    prisma.tenant.create({ data: { slug: "tenant_a", name: "Tenant A" } }),
    prisma.tenant.create({ data: { slug: "tenant_b", name: "Tenant B" } }),
  ]);
  tenants.a = ta.id;
  tenants.b = tb.id;
  const people = [
    { userId: ids.a, fullName: "Ana Ribeiro", email: "ana@a.test" },
    { userId: ids.b, fullName: "Bruno Costa", email: "bruno@b.test" },
    { userId: ids.orphan, fullName: "Sem Vínculo", email: "orfao@a.test" },
    { userId: ids.twoTenants, fullName: "Dois Tenants", email: "dois@a.test" },
  ];
  await prisma.profile.createMany({ data: people });
  await prisma.membership.createMany({
    data: [
      { tenantId: ta.id, userId: ids.a, role: "EMPLOYEE" },
      { tenantId: tb.id, userId: ids.b, role: "OPERATIONS" },
      { tenantId: ta.id, userId: ids.twoTenants, role: "EMPLOYEE" },
      { tenantId: tb.id, userId: ids.twoTenants, role: "EMPLOYEE" },
    ],
  });
}, 180_000);

afterAll(async () => {
  await app?.close();
  await container?.stop();
}, 60_000);

describe("GET /v1/me", () => {
  it("CA-6: com token válido devolve id, e-mail, nome, papel e tenant do vínculo", async () => {
    const res = await me(await token(ids.a)).expect(200);
    expect(res.body).toEqual({
      userId: ids.a,
      email: "ana@a.test",
      fullName: "Ana Ribeiro",
      role: "EMPLOYEE",
      tenant: { slug: "tenant_a", name: "Tenant A" },
    });
    const ops = await me(await token(ids.b)).expect(200);
    expect(ops.body).toMatchObject({ role: "OPERATIONS", tenant: { slug: "tenant_b" } });
  });

  it("CA-6: sem token, token malformado, expirado, de outra chave, de outro emissor ou de outra audiência → 401 Problem Details", async () => {
    expectProblem(await me(), 401);
    expectProblem(await request(app.getHttpServer()).get("/v1/me").set("Authorization", "Basic abc"), 401);
    expectProblem(await me("nao-e-um-jwt"), 401);
    expectProblem(await me(await token(ids.a, { expiresIn: Math.floor(Date.now() / 1000) - 60 })), 401);
    expectProblem(await me(await token(ids.a, { key: otherKey })), 401);
    expectProblem(await me(await token(ids.a, { issuer: "https://outro-projeto.supabase.co/auth/v1" })), 401);
    expectProblem(await me(await token(ids.a, { audience: "anon" })), 401);
  });

  it("CA-7: conta autenticada sem vínculo ou com mais de um → 403 Problem Details", async () => {
    expectProblem(await me(await token(ids.orphan)), 403);
    expectProblem(await me(await token(ids.twoTenants)), 403);
    expectProblem(await me(await token(randomUUID())), 403);
  });

  it("CA-8: usuário e tenant vêm só do token; query, corpo e cabeçalhos com outra pessoa ou outro tenant são ignorados", async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/me?userId=${ids.b}&tenantId=${tenants.b}&tenant=tenant_b`)
      .set("Authorization", `Bearer ${await token(ids.a)}`)
      .set("X-Tenant-Id", tenants.b)
      .set("X-User-Id", ids.b)
      .send({ userId: ids.b, tenantId: tenants.b })
      .expect(200);
    expect(res.body).toMatchObject({ userId: ids.a, email: "ana@a.test", tenant: { slug: "tenant_a" } });
    expect(JSON.stringify(res.body)).not.toMatch(/tenant_b|Bruno|bruno@b\.test/);
  });
});

describe("CORS", () => {
  const preflight = (origin: string) =>
    request(app.getHttpServer())
      .options("/v1/me")
      .set("Origin", origin)
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "authorization");

  it("CA-9: aceita só as origens de CORS_ORIGIN e o cabeçalho Authorization", async () => {
    for (const origin of [FRONT, "http://outro-front.test"]) {
      const ok = await preflight(origin);
      expect(ok.status).toBeLessThan(300);
      expect(ok.headers["access-control-allow-origin"]).toBe(origin);
      expect(ok.headers["access-control-allow-headers"]).toMatch(/authorization/i);
    }

    const blocked = await preflight("http://evil.test");
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();

    const get = await me(await token(ids.a)).set("Origin", "http://evil.test");
    expect(get.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
