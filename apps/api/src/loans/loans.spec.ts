// spec solicitar-emprestimo, CA-1 to CA-6: catalog, request, refusals,
// races, role and tenant isolation, my loans. Real Postgres.
import { randomUUID } from "node:crypto";
import request from "supertest";
import { saoPauloDates } from "../common/dates.js";
import { startTestApp, type TestApp } from "../test/app.js";

let t: TestApp;
const people = {
  ana: randomUUID(), // EMPLOYEE, tenant A
  bia: randomUUID(), // EMPLOYEE, tenant A
  ops: randomUUID(), // OPERATIONS, tenant A
  zeca: randomUUID(), // EMPLOYEE, tenant B
};
const tenant = { a: "", b: "" };
let today = "";

const api = () => request(t.app.getHttpServer());
const as = async (who: string) => `Bearer ${await t.token(who)}`;
const ask = async (who: string, equipmentId: string) =>
  api().post("/v1/loans").set("Authorization", await as(who)).send({ equipmentId });
const catalog = async (who: string) =>
  (await api().get("/v1/equipment").set("Authorization", await as(who)).expect(200)).body.items as Array<Record<string, unknown>>;

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function newEquipment(tenantId: string, assetTag: string, status: "AVAILABLE" | "MAINTENANCE" = "AVAILABLE") {
  return t.prisma.equipment.create({
    data: { tenantId, assetTag, name: `Item ${assetTag}`, category: "NOTEBOOK", status, imagePath: `${assetTag}.jpg`, notes: status === "MAINTENANCE" ? "Tela com defeito" : null },
  });
}

async function openLoan(borrowerId: string, equipmentId: string, dueDate: string, tenantId = tenant.a) {
  return t.prisma.loan.create({ data: { tenantId, equipmentId, borrowerId, dueDate: new Date(`${dueDate}T00:00:00Z`) } });
}

async function expectRefusal(res: request.Response, status: number, reason: string) {
  expect([res.status, res.body.reason]).toEqual([status, reason]);
  expect(res.headers["content-type"]).toMatch(/^application\/problem\+json/);
  expect(typeof res.body.detail).toBe("string");
}

beforeAll(async () => {
  t = await startTestApp();
  const [a, b] = await Promise.all([
    t.prisma.tenant.create({ data: { slug: "tenant_a", name: "Tenant A" } }),
    t.prisma.tenant.create({ data: { slug: "tenant_b", name: "Tenant B" } }),
  ]);
  tenant.a = a.id;
  tenant.b = b.id;
  await t.prisma.profile.createMany({
    data: [
      { userId: people.ana, fullName: "Ana Ribeiro", email: "ana@a.test" },
      { userId: people.bia, fullName: "Bia Souza", email: "bia@a.test" },
      { userId: people.ops, fullName: "Otávio Ops", email: "ops@a.test" },
      { userId: people.zeca, fullName: "Zeca Lima", email: "zeca@b.test" },
    ],
  });
  await t.prisma.membership.createMany({
    data: [
      { tenantId: a.id, userId: people.ana, role: "EMPLOYEE" },
      { tenantId: a.id, userId: people.bia, role: "EMPLOYEE" },
      { tenantId: a.id, userId: people.ops, role: "OPERATIONS" },
      { tenantId: b.id, userId: people.zeca, role: "EMPLOYEE" },
    ],
  });
  ({ today } = await saoPauloDates(t.prisma));
}, 180_000);

afterAll(async () => {
  await t?.close();
}, 60_000);

// Loans and equipment are recreated per test; audit_log is append-only and
// keeps growing, so tests count only their own audit rows.
beforeEach(async () => {
  await t.prisma.loan.deleteMany();
  await t.prisma.equipment.deleteMany();
});

describe("GET /v1/equipment", () => {
  it("CA-1: devolve os itens do tenant com situação derivada; empréstimo de outra pessoa sem nome, id nem prazo", async () => {
    const free = await newEquipment(tenant.a, "TI-0001");
    await newEquipment(tenant.a, "TI-0002", "MAINTENANCE");
    const mine = await newEquipment(tenant.a, "TI-0003");
    const others = await newEquipment(tenant.a, "TI-0004");
    await newEquipment(tenant.b, "TI-9999");
    await openLoan(people.ana, mine.id, addDays(today, 3));
    await openLoan(people.bia, others.id, addDays(today, -2)); // overdue, but someone else's

    const items = await catalog(people.ana);
    expect(items.map((i) => [i.assetTag, i.situation])).toEqual([
      ["TI-0001", "AVAILABLE"],
      ["TI-0002", "MAINTENANCE"],
      ["TI-0003", "MINE"],
      ["TI-0004", "LOANED"],
    ]);
    expect(items[0]).toMatchObject({ id: free.id, name: "Item TI-0001", category: "NOTEBOOK", imagePath: "TI-0001.jpg", notes: null });
    expect(items[1]).toMatchObject({ notes: "Tela com defeito" });
    expect(items[2]).toMatchObject({ dueDate: addDays(today, 3), overdue: false });
    expect(Object.keys(items[3]).sort()).toEqual(["assetTag", "category", "id", "imagePath", "name", "notes", "situation"]);
    expect(JSON.stringify(items)).not.toMatch(new RegExp(`${people.bia}|Bia|TI-9999`));
  });

  it("CA-1: o próprio empréstimo vencido aparece como atrasado; para outra pessoa o mesmo item é só LOANED", async () => {
    const eq = await newEquipment(tenant.a, "TI-0005");
    await openLoan(people.ana, eq.id, addDays(today, -1));
    expect((await catalog(people.ana))[0]).toMatchObject({ situation: "MINE", overdue: true, dueDate: addDays(today, -1) });
    expect((await catalog(people.bia))[0]).toEqual(expect.not.objectContaining({ dueDate: expect.anything() }));
    expect((await catalog(people.bia))[0]).toMatchObject({ situation: "LOANED" });
  });
});

describe("POST /v1/loans", () => {
  it("CA-2: cria com devolução em hoje + 14 dias corridos (São Paulo), grava auditoria e o item passa a MINE", async () => {
    const eq = await newEquipment(tenant.a, "TI-0010");
    const res = await ask(people.ana, eq.id);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ equipmentId: eq.id, dueDate: addDays(today, 14) });
    expect(Math.abs(Date.parse(res.body.loanedAt) - Date.now())).toBeLessThan(60_000);

    const loan = await t.prisma.loan.findUniqueOrThrow({ where: { id: res.body.id } });
    expect(loan).toMatchObject({ tenantId: tenant.a, borrowerId: people.ana, equipmentId: eq.id, returnedAt: null });
    expect(loan.dueDate.toISOString().slice(0, 10)).toBe(addDays(today, 14));

    const audit = await t.prisma.auditLog.findMany({ where: { entityId: res.body.id } });
    expect(audit).toEqual([
      expect.objectContaining({ tenantId: tenant.a, actorId: people.ana, action: "loan.created", entityType: "loan", metadata: { equipmentId: eq.id, dueDate: addDays(today, 14) } }),
    ]);
    expect((await catalog(people.ana))[0]).toMatchObject({ situation: "MINE", dueDate: addDays(today, 14) });
  });

  it("CA-2: o prazo vem de tenants.loan_period_days", async () => {
    await t.prisma.tenant.update({ where: { id: tenant.a }, data: { loanPeriodDays: 7 } });
    try {
      const eq = await newEquipment(tenant.a, "TI-0011");
      expect((await ask(people.ana, eq.id)).body.dueDate).toBe(addDays(today, 7));
    } finally {
      await t.prisma.tenant.update({ where: { id: tenant.a }, data: { loanPeriodDays: 14 } });
    }
  });

  it("CA-3: recusa manutenção, já emprestado, atraso, limite e item inexistente ou de outro tenant, sem criar nada", async () => {
    const auditBefore = await t.prisma.auditLog.count();
    const maintenance = await newEquipment(tenant.a, "TI-0020", "MAINTENANCE");
    const taken = await newEquipment(tenant.a, "TI-0021");
    const foreign = await newEquipment(tenant.b, "TI-0022");
    const free = await newEquipment(tenant.a, "TI-0023");
    await openLoan(people.bia, taken.id, addDays(today, 5));

    await expectRefusal(await ask(people.ana, maintenance.id), 409, "maintenance");
    await expectRefusal(await ask(people.ana, taken.id), 409, "already_loaned");
    await expectRefusal(await ask(people.ana, foreign.id), 404, "not_found");
    await expectRefusal(await ask(people.ana, randomUUID()), 404, "not_found");
    await expectRefusal(await api().post("/v1/loans").set("Authorization", await as(people.ana)).send({ equipmentId: "TI-0023" }), 400, "invalid_request");

    // Overdue blocks, even below the limit.
    const late = await newEquipment(tenant.a, "TI-0024");
    const lateLoan = await openLoan(people.ana, late.id, addDays(today, -1));
    await expectRefusal(await ask(people.ana, free.id), 409, "overdue");
    await t.prisma.loan.delete({ where: { id: lateLoan.id } });

    // Limit: 3 open loans (tenants.loan_limit).
    for (const tag of ["TI-0030", "TI-0031", "TI-0032"]) {
      await openLoan(people.ana, (await newEquipment(tenant.a, tag)).id, addDays(today, 10));
    }
    await expectRefusal(await ask(people.ana, free.id), 409, "loan_limit");

    expect(await t.prisma.loan.count({ where: { equipmentId: { in: [maintenance.id, free.id, foreign.id] } } })).toBe(0);
    expect(await t.prisma.auditLog.count()).toBe(auditBefore);
  });

  it("CA-4: pedidos simultâneos ao mesmo item criam um só empréstimo; os outros recebem 409 já emprestado", async () => {
    const eq = await newEquipment(tenant.a, "TI-0040");
    const [ana, bia] = [await as(people.ana), await as(people.bia)];
    const results = await Promise.all(
      [ana, bia, ana, bia, ana, bia].map((auth) => api().post("/v1/loans").set("Authorization", auth).send({ equipmentId: eq.id })),
    );

    expect(results.map((r) => r.status).sort()).toEqual([201, 409, 409, 409, 409, 409]);
    for (const r of results.filter((r) => r.status === 409)) expect(r.body.reason).toBe("already_loaned");
    expect(await t.prisma.loan.count({ where: { equipmentId: eq.id } })).toBe(1);
  });

  it("CA-4: pedidos simultâneos da mesma pessoa a itens diferentes não passam do limite", async () => {
    for (const tag of ["TI-0050", "TI-0051"]) {
      await openLoan(people.ana, (await newEquipment(tenant.a, tag)).id, addDays(today, 10));
    }
    const targets = await Promise.all(["TI-0052", "TI-0053", "TI-0054", "TI-0055"].map((tag) => newEquipment(tenant.a, tag)));
    const auth = await as(people.ana);
    const results = await Promise.all(targets.map((eq) => api().post("/v1/loans").set("Authorization", auth).send({ equipmentId: eq.id })));

    expect(results.map((r) => r.status).sort()).toEqual([201, 409, 409, 409]);
    for (const r of results.filter((r) => r.status === 409)) expect(r.body.reason).toBe("loan_limit");
    expect(await t.prisma.loan.count({ where: { borrowerId: people.ana, returnedAt: null } })).toBe(3);
  });

  it("CA-5: Operações recebe 403; pessoa e tenant vêm só do token", async () => {
    const eq = await newEquipment(tenant.a, "TI-0060");
    await expectRefusal(await ask(people.ops, eq.id), 403, "employees_only");

    const res = await api()
      .post(`/v1/loans?borrowerId=${people.bia}&tenantId=${tenant.b}`)
      .set("Authorization", await as(people.ana))
      .set("X-Tenant-Id", tenant.b)
      .set("X-User-Id", people.bia)
      .send({ equipmentId: eq.id, borrowerId: people.bia, tenantId: tenant.b });
    expect(res.status).toBe(201);
    expect(await t.prisma.loan.findUniqueOrThrow({ where: { id: res.body.id } })).toMatchObject({ borrowerId: people.ana, tenantId: tenant.a });

    // Someone from tenant B cannot borrow tenant A's equipment, whatever the body says.
    const other = await newEquipment(tenant.a, "TI-0061");
    await expectRefusal(
      await api().post("/v1/loans").set("Authorization", await as(people.zeca)).send({ equipmentId: other.id, tenantId: tenant.a }),
      404,
      "not_found",
    );
  });
});

describe("GET /v1/loans/mine", () => {
  it("CA-6: só os empréstimos em aberto da pessoa do token, com equipamento e datas", async () => {
    const [e1, e2, e3, e4] = await Promise.all(["TI-0070", "TI-0071", "TI-0072", "TI-0073"].map((tag) => newEquipment(tenant.a, tag)));
    await openLoan(people.ana, e1.id, addDays(today, 4));
    await openLoan(people.ana, e2.id, addDays(today, -3));
    const returned = await openLoan(people.ana, e3.id, addDays(today, 1));
    await t.prisma.loan.update({ where: { id: returned.id }, data: { returnedAt: new Date() } });
    await openLoan(people.bia, e4.id, addDays(today, 2));

    const res = await api()
      .get(`/v1/loans/mine?userId=${people.bia}`)
      .set("Authorization", await as(people.ana))
      .set("X-User-Id", people.bia)
      .expect(200);

    expect(res.body).toMatchObject({ loanLimit: 3, loanPeriodDays: 14 });
    expect(res.body.loans.map((l: { equipment: { assetTag: string }; dueDate: string; overdue: boolean }) => [l.equipment.assetTag, l.dueDate, l.overdue])).toEqual([
      ["TI-0071", addDays(today, -3), true],
      ["TI-0070", addDays(today, 4), false],
    ]);
    expect(res.body.loans[0].equipment).toEqual({ id: e2.id, assetTag: "TI-0071", name: "Item TI-0071", category: "NOTEBOOK", imagePath: "TI-0071.jpg" });
    expect(typeof res.body.loans[0].loanedAt).toBe("string");
    expect(JSON.stringify(res.body)).not.toMatch(/TI-0072|TI-0073/);
  });
});
