// Test-only: renders the real routes with in-memory Auth and API.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../app/routes";
import { SessionProvider } from "../app/session";
import { type Api, ApiError, type CatalogItem, type CreatedLoan, type Me, type MyLoan } from "../lib/api/types";
import type { AuthClient, Session, SignInResult } from "../lib/auth/types";
import { addDays, saoPauloDate } from "../lib/dates";

export const PROFESSOR: Me = {
  userId: "11111111-1111-4111-8111-111111111111",
  email: "marcelo.grilo@institutojef.org.br",
  fullName: "Marcelo Grilo",
  role: "EMPLOYEE",
  tenant: { slug: "suporte_ti", name: "Suporte de TI" },
};

export const OPS: Me = {
  userId: "22222222-2222-4222-8222-222222222222",
  email: "ops@empresa.test",
  fullName: "Camila Nunes Prado",
  role: "OPERATIONS",
  tenant: { slug: "suporte_ti", name: "Suporte de TI" },
};

/** Supabase Auth in memory. The session survives a remount, like the browser's storage. */
export class FakeAuth implements AuthClient {
  session: Session | null = null;
  signInCalls = 0;
  signOutCalls = 0;
  private listeners = new Set<(s: Session | null) => void>();
  private readonly accounts: Map<string, string>;

  constructor(accounts: Record<string, string> = { [PROFESSOR.email]: "senha-certa", [OPS.email]: "senha-ops" }) {
    this.accounts = new Map(Object.entries(accounts));
  }

  async getSession() {
    return this.session;
  }

  async signIn(email: string, password: string): Promise<SignInResult> {
    this.signInCalls++;
    if (this.accounts.get(email) !== password) return { ok: false, reason: "invalid_credentials" };
    this.session = { accessToken: `token:${email}`, email };
    return { ok: true, session: this.session };
  }

  async signOut() {
    this.signOutCalls++;
    this.session = null;
    this.listeners.forEach((l) => l(null));
  }

  onChange(listener: (s: Session | null) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  signedInAs(email: string) {
    this.session = { accessToken: `token:${email}`, email };
    return this;
  }
}

type FakeItem = Omit<CatalogItem, "situation" | "dueDate" | "overdue"> & { status: "AVAILABLE" | "MAINTENANCE" };

const item = (n: number, name: string, category: CatalogItem["category"], status: FakeItem["status"] = "AVAILABLE", notes: string | null = null): FakeItem => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  assetTag: `TI-${String(n).padStart(4, "0")}`,
  name,
  category,
  imagePath: `TI-${String(n).padStart(4, "0")}.jpg`,
  notes,
  status,
});

export const ITEMS: FakeItem[] = [
  item(1, "Notebook 14 polegadas", "NOTEBOOK"),
  item(2, "Monitor 24 polegadas", "MONITOR"),
  item(3, "Cabo HDMI 2 m", "CABLE"),
  item(4, "Notebook 15 polegadas", "NOTEBOOK", "MAINTENANCE", "Teclado com defeito"),
  item(5, "Webcam Full HD", "CAMERA"),
];

type FakeLoan = { id: string; email: string; equipmentId: string; loanedAt: string; dueDate: string };

/**
 * The API in memory. Business rules are the API's (tested in apps/api);
 * here a refusal is set by the test with `refuseNext`.
 */
export class FakeApi implements Api {
  people: Me[] = [PROFESSOR, OPS];
  items: FakeItem[] = ITEMS.map((i) => ({ ...i }));
  loans: FakeLoan[] = [];
  loanLimit = 3;
  loanPeriodDays = 14;
  requests: string[] = [];
  private refusal: ApiError | null = null;

  private person(token: string): Me {
    const p = this.people.find((x) => `token:${x.email}` === token);
    if (!p) throw new ApiError(403, "A conta não tem vínculo com nenhum tenant.", "no_membership");
    return p;
  }

  /** Gives `email` an open loan of item n, due `dueInDays` from today (negative = overdue). */
  lend(email: string, n: number, dueInDays = 10) {
    const today = saoPauloDate();
    this.loans.push({ id: `loan-${this.loans.length + 1}`, email, equipmentId: ITEMS[n - 1].id, loanedAt: new Date().toISOString(), dueDate: addDays(today, dueInDays) });
    return this;
  }

  refuseNext(status: number, reason: string, detail: string) {
    this.refusal = new ApiError(status, detail, reason);
    return this;
  }

  async me(token: string) {
    return this.person(token);
  }

  async equipment(token: string) {
    const me = this.person(token);
    const today = saoPauloDate();
    return {
      items: this.items.map(({ status, ...rest }): CatalogItem => {
        const loan = this.loans.find((l) => l.equipmentId === rest.id);
        if (loan && loan.email === me.email) return { ...rest, situation: "MINE", dueDate: loan.dueDate, overdue: loan.dueDate < today };
        if (loan) return { ...rest, situation: "LOANED" };
        return { ...rest, situation: status };
      }),
    };
  }

  async myLoans(token: string) {
    const me = this.person(token);
    const today = saoPauloDate();
    const loans: MyLoan[] = this.loans
      .filter((l) => l.email === me.email)
      .map((l) => {
        const eq = this.items.find((i) => i.id === l.equipmentId)!;
        return {
          id: l.id,
          loanedAt: l.loanedAt,
          dueDate: l.dueDate,
          overdue: l.dueDate < today,
          equipment: { id: eq.id, assetTag: eq.assetTag, name: eq.name, category: eq.category, imagePath: eq.imagePath },
        };
      });
    return { loanLimit: this.loanLimit, loanPeriodDays: this.loanPeriodDays, loans };
  }

  async requestLoan(token: string, equipmentId: string): Promise<CreatedLoan> {
    const me = this.person(token);
    this.requests.push(equipmentId);
    if (this.refusal) {
      const r = this.refusal;
      this.refusal = null;
      throw r;
    }
    const loan = { id: `loan-${this.loans.length + 1}`, email: me.email, equipmentId, loanedAt: new Date().toISOString(), dueDate: addDays(saoPauloDate(), this.loanPeriodDays) };
    this.loans.push(loan);
    return { id: loan.id, equipmentId, loanedAt: loan.loanedAt, dueDate: loan.dueDate };
  }
}

export function renderApp(path: string, { auth = new FakeAuth(), api = new FakeApi() as Api } = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider services={{ auth, api }}>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>,
  );
  return { ...view, router, auth, api, path: () => router.state.location.pathname };
}
