// Integration tests for the initial data seed (spec dados-iniciais).
// Real Postgres via Testcontainers, migrations applied from prisma/migrations,
// Supabase Auth replaced by an in-memory fake.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../src/generated/prisma/client.js";
import type { AuthAdmin } from "./auth.js";
import { buildSeedInput, loadSeedInput, PROFESSOR, SeedInputError, type Credit, type ListItem } from "./data.js";
import { runSeed } from "./run.js";

const SLOW = 60_000;

const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../migrations");
const PASSWORD = "senha-de-teste-123";

class FakeAuth implements AuthAdmin {
  users = new Map<string, { id: string; password: string; emailConfirmed: boolean }>();
  async findUserIdByEmail(email: string) {
    return this.users.get(email.toLowerCase())?.id ?? null;
  }
  async createUser(input: { email: string; password: string; emailConfirmed: true }) {
    const id = crypto.randomUUID();
    this.users.set(input.email.toLowerCase(), { id, password: input.password, emailConfirmed: input.emailConfirmed });
    return id;
  }
}

let container: StartedPostgreSqlContainer;
let prisma: PrismaClient;

async function applyMigrations(url: string) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const dirs = (await readdir(MIGRATIONS_DIR, { withFileTypes: true }))
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    for (const dir of dirs) await client.query(await readFile(path.join(MIGRATIONS_DIR, dir, "migration.sql"), "utf8"));
  } finally {
    await client.end();
  }
}

// audit_log is append-only (TRUNCATE/DELETE rejected by a trigger) and the
// seed never writes to it, so it is left alone; the rest is deleted in FK order.
async function resetData() {
  await prisma.loan.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.tenant.deleteMany();
}

const counts = async () => ({
  tenants: await prisma.tenant.count(),
  equipment: await prisma.equipment.count(),
  profiles: await prisma.profile.count(),
  memberships: await prisma.membership.count(),
  loans: await prisma.loan.count(),
});

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:17-alpine").start();
  await applyMigrations(container.getConnectionUri());
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: container.getConnectionUri() }) });
}, 180_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await container?.stop();
}, SLOW);

beforeEach(resetData);

const realInput = () => loadSeedInput({ PROFESSOR_INITIAL_PASSWORD: PASSWORD });

describe("seed dados-iniciais", () => {
  it("CA-1: cria exatamente os 12 equipamentos da lista no tenant suporte_ti, com patrimônio, nome e categoria", async () => {
    const input = await realInput();
    await runSeed(prisma, new FakeAuth(), input);

    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: "suporte_ti" } });
    const rows = await prisma.equipment.findMany({ where: { tenantId: tenant.id }, orderBy: { assetTag: "asc" } });
    expect(rows).toHaveLength(12);

    const list = JSON.parse(
      await readFile(path.resolve(MIGRATIONS_DIR, "../../../../packages/equipment-images/equipamentos.json"), "utf8"),
    ) as ListItem[];
    expect(rows.map((r) => [r.assetTag, r.name])).toEqual(list.map((i) => [i.patrimonio, i.nome]));

    const byCategory = rows.reduce<Record<string, number>>((acc, r) => ({ ...acc, [r.category]: (acc[r.category] ?? 0) + 1 }), {});
    expect(byCategory).toEqual({ NOTEBOOK: 4, MONITOR: 3, CABLE: 3, CAMERA: 2 });
  }, SLOW);

  it("CA-2: TI-0004, TI-0007 e TI-0010 em manutenção; os outros 9 disponíveis", async () => {
    await runSeed(prisma, new FakeAuth(), await realInput());
    const maintenance = await prisma.equipment.findMany({ where: { status: "MAINTENANCE" }, orderBy: { assetTag: "asc" } });
    expect(maintenance.map((e) => e.assetTag)).toEqual(["TI-0004", "TI-0007", "TI-0010"]);
    expect(await prisma.equipment.count({ where: { status: "AVAILABLE" } })).toBe(9);
  }, SLOW);

  it("CA-3: image_path de cada equipamento é o arquivo de creditos.json; o banco recusa caminho inválido", async () => {
    await runSeed(prisma, new FakeAuth(), await realInput());
    const credits = JSON.parse(
      await readFile(path.resolve(MIGRATIONS_DIR, "../../../../packages/equipment-images/creditos.json"), "utf8"),
    ) as Credit[];
    const rows = await prisma.equipment.findMany({ orderBy: { assetTag: "asc" } });
    for (const row of rows) {
      const credit = credits.find((c) => c.patrimonio === row.assetTag);
      expect(row.imagePath).toBe(credit?.arquivo);
      expect(row.imagePath).toBe(`${row.assetTag}.jpg`);
    }

    for (const bad of ["https://pixabay.com/get/x.jpg", "fotos/TI-0001.jpg", "../TI-0001.jpg", "TI-0001.gif", "TI-0001..jpg"]) {
      await expect(
        prisma.equipment.update({ where: { id: rows[0].id }, data: { imagePath: bad } }),
      ).rejects.toThrow(/equipment_image_path_format/);
    }
  }, SLOW);

  it("CA-4: o seed não cria empréstimo e o professor fica com zero empréstimos", async () => {
    const summary = await runSeed(prisma, new FakeAuth(), await realInput());
    expect(await prisma.loan.count()).toBe(0);
    const membership = await prisma.membership.findFirstOrThrow({ where: { userId: summary.professorUserId } });
    expect(await prisma.loan.count({ where: { borrowerId: membership.id } })).toBe(0);
  }, SLOW);

  it("CA-5: conta do professor no Auth com e-mail confirmado e a senha da variável; perfil e vínculo EMPLOYEE", async () => {
    const auth = new FakeAuth();
    const summary = await runSeed(prisma, auth, await realInput());

    const account = auth.users.get(PROFESSOR.email);
    expect(account).toEqual({ id: summary.professorUserId, password: PASSWORD, emailConfirmed: true });

    const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: summary.professorUserId } });
    expect(profile).toMatchObject({ fullName: "Marcelo Grilo", email: PROFESSOR.email });

    const membership = await prisma.membership.findFirstOrThrow({
      where: { userId: summary.professorUserId },
      include: { tenant: true },
    });
    expect(membership.role).toBe("EMPLOYEE");
    expect(membership.tenant.slug).toBe("suporte_ti");
  }, SLOW);

  it("CA-6: rodar duas vezes não duplica nada, não troca a senha e não altera a situação de equipamento existente", async () => {
    const auth = new FakeAuth();
    await runSeed(prisma, auth, await realInput());
    const first = await counts();

    // Operations changes a status; someone changes the env password.
    await prisma.equipment.updateMany({ where: { assetTag: "TI-0004" }, data: { status: "AVAILABLE" } });
    await runSeed(prisma, auth, await loadSeedInput({ PROFESSOR_INITIAL_PASSWORD: "outra-senha-456" }));

    expect(await counts()).toEqual(first);
    expect(first).toEqual({ tenants: 1, equipment: 12, profiles: 1, memberships: 1, loans: 0 });
    expect(auth.users.size).toBe(1);
    expect(auth.users.get(PROFESSOR.email)?.password).toBe(PASSWORD);
    expect((await prisma.equipment.findFirstOrThrow({ where: { assetTag: "TI-0004" } })).status).toBe("AVAILABLE");
  }, SLOW);

  it("CA-7: sem senha ou com equipamento sem foto, o seed para dizendo o que falta e não grava nada", async () => {
    await expect(loadSeedInput({})).rejects.toThrow(/PROFESSOR_INITIAL_PASSWORD ausente/);
    await expect(loadSeedInput({ PROFESSOR_INITIAL_PASSWORD: "   " })).rejects.toThrow(SeedInputError);

    const list: ListItem[] = [
      { patrimonio: "TI-0001", nome: "Notebook", categoria: "notebook", situacao: "disponivel" },
      { patrimonio: "TI-0005", nome: "Monitor", categoria: "monitor", situacao: "disponivel" },
    ];
    const credits: Credit[] = [{ patrimonio: "TI-0001", arquivo: "TI-0001.jpg" }];
    expect(() => buildSeedInput({ list, credits, password: PASSWORD })).toThrow(/TI-0005: sem foto em creditos.json/);

    // Validation happens before any write: the database is untouched.
    expect(await counts()).toEqual({ tenants: 0, equipment: 0, profiles: 0, memberships: 0, loans: 0 });
  }, SLOW);
});
