// Test-only: renders the real routes with in-memory Auth and API.
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../app/routes";
import { SessionProvider } from "../app/session";
import { ApiError, type FetchMe, type Me } from "../lib/api/me";
import type { AuthClient, Session, SignInResult } from "../lib/auth/types";

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

/** /v1/me in memory: answers by the token's e-mail; unknown accounts get 403. */
export function fakeFetchMe(people: Me[] = [PROFESSOR, OPS]): FetchMe {
  return async (token) => {
    const person = people.find((p) => `token:${p.email}` === token);
    if (!person) throw new ApiError(403, "A conta não tem vínculo com nenhum tenant.");
    return person;
  };
}

export function renderApp(path: string, { auth = new FakeAuth(), fetchMe = fakeFetchMe() } = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider services={{ auth, fetchMe }}>
        <RouterProvider router={router} />
      </SessionProvider>
    </QueryClientProvider>,
  );
  return { ...view, router, auth, path: () => router.state.location.pathname };
}
